const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../utils/nodemailer");
const cloudinary = require("../utils/cloudinary");

// integrated
const registerController = async (req, res) => {
  try {
    const { username, email, password, image } = req.body;

    const existingUser = await User.findOne({ email });
    if (username && email && password && image !== "") {
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const upload = await cloudinary.v2.uploader.upload(image, {
          // folder: "polaroid_mems_profilepics",
        });
        if (upload) {
          const profilepIcUrl = upload.secure_url;
          const newUser = new User({
            username,
            email,
            password: hashedPassword,
            profilepIcUrl,
          });
          await newUser.save();
          // await transporter.sendMail({
          //   from: "irfanusuf33@gmail.com",
          //   to: `${email}`,
          //   subject: "Welecome Email ",
          //   text: `Welcome ${username} . Stay tuned For our upcoming Social App`,
          // });
          res.json({ message: "User Created" });
        } else {
          res.json({ message: "Cloudinary Error!" });
        }
      } else {
        res.json({ message: "user Already Exits" });
      }
    } else {
      res.json({ message: "All Credentials required" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
// done
const loginController = async (req, res) => {
  try {
    const { username, password } = req.body;
    const isUser = await User.findOne({ username });
    if (username !== "" && password !== "") {
      if (isUser) {
        const passVerify = await bcrypt.compare(password, isUser.password);

        if (passVerify) {
          const token = jwt.sign(
            {
              _id: isUser._id,
            },
            "sevensprings"
          );

          const userId = isUser._id;

          // res.cookie("username" , username ,{ httpOnly: true });

          res.json({ message: "Logged In", token, userId });
        } else {
          res.json({ message: "Password Doesnot Match" });
        }
      } else {
        res.json({ message: "User Not Found" });
      }
    } else {
      res.json({ message: "All Credentials Required" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
// done
const logoutController = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const decode = await jwt.verify(token, `${secretKey}`);

      if (decode) {
        res.clearCookie("token");
        res.json({ message: "logged Out succesfuly" });
      } else {
        res.json({ message: "some thing Went wrong " });
      }
    } else {
      res.json({ message: "missing token" });
    }
  } catch (error) {
    console.log(error);
    res.json({ message: "internal server Error " });
  }
};

const forgotpassController = async (req, res) => {
  try {
    const { email } = req.body; // u can take answer of the security question for further validation
    const isUser = await User.findOne({ email });

    const mailOptions = {
      from: "gurtejsinghbakshi@gmail.com",
      to: `${email}`,
      subject: "Link For Changing Password",
      text: " some text ",
    };

    if (email !== "") {
      if (isUser) {
        await transporter.sendMail(mailOptions);

        res.json({
          message:
            " kindly check ur mail .We have provided a link for changing password ",
        });
      } else {
        res.json({ message: "No user Found" });
      }
    } else {
      res.json({ message: "Email required!" });
    }
  } catch (error) {
    console.log(error);
  }
};

const changepassController = async (req, res) => {
  try {
    const _id = req.query._id;
    const { newpassWord } = req.body;
    const hashedPassword = await bcrypt.hash(newpassWord, 10);

    // this method finds user by id and updates its password then load new userinformation in memory

    const changePassword = await User.findByIdAndUpdate(_id, {
      password: hashedPassword,
    });

    if (changePassword) {
      res.json({ message: "Password Changed " });
    } else {
      res.json({ message: " somethig went wrong " });
    }

    // this methods find user by id and loads it in memory then the second instruction changes
    // paswword and the new user is loaded  again
    // in memory
    // const validUser = await User.findById({ _id });
    // if (validUser) {
    //   validUser.password = hashedPassword;

    //   await validUser.save();

    //   res.json({ message: " password changed " });
    // } else {
    //   res.json({ message: " something Went Wrong" });
    // }
  } catch (error) {
    console.log(error);
  }
};

const deleteController = async (req, res) => {
  const _id = req.query._id;
  const { password } = req.body;
  try {
    const isUser = await User.findById(_id);

    const verifyPass = bcrypt.compare(password, isUser.password);
    if (verifyPass) {
      await User.deleteOne({ _id });
      res.json({ mesaage: "your account has been sent for deletion " });
    } else {
      res.json({ mesaage: "something went Wrong " });
    }
  } catch (error) {
    console.log(error);
  }
};

const followUserHandler = async (req, res) => {
  try {
    const userId = req.info._id;
    const { userToFollow } = req.query;

    const isUser = await User.findById(userId);
    const isUserTofollow = await User.findById(userToFollow);

    if (isUser && isUserTofollow) {
      // const alreadyFollowed = await isUserTofollow.userFollowers.includes(userId)
      const indexofFollower = await isUserTofollow.userFollowers.findIndex(
        (object) => object._id.toString() === userId
      );

      const indexOfFollowing = await isUser.userFollowing.findIndex(
        (object) => object._id.toString() === userToFollow
      );

      if (indexofFollower > -1 && indexOfFollowing > -1) {
        await isUserTofollow.userFollowers.splice(indexofFollower, 1);
        await isUserTofollow.save();
        await isUser.userFollowing.splice(indexOfFollowing, 1);
        await isUser.save();
        res.json({ message: "u unfollowed the user" });
      } else {
        await isUserTofollow.userFollowers.push(userId);
        await isUserTofollow.save();
        await isUser.userFollowing.push(userToFollow);
        await isUser.save();
        res.json({ message: "u followed the user" });
      }
    } else {
      res.status(404).json({ message: "user Not Found!" });
    }
  } catch (err) {
    console.log(err);
  }
};

// done
const getUser = async (req, res) => {
  const _id = req.query.userId;

  const user = await User.findById(_id).populate([
    {
      path: "posts.post",
      model: "Post",
    },
  ]); //time complexity log n

  if (user) {
    res.json({ message: "user Found", user });
  } else {
    res.json({ message: "user Not Found" });
  }
};

module.exports = {
  registerController,
  loginController,
  logoutController,
  forgotpassController,
  changepassController,
  deleteController,
  followUserHandler,
  getUser,
};