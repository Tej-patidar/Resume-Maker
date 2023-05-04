var express = require('express');
var router = express.Router();
const nodemailer = require("nodemailer");
const upload = require("../helpers/multer").single("avatar");
const fs = require("fs");
// Step three of passport. 
const User = require("../models/userModel");
const passport = require("passport");
const Localstrategy = require("passport-local");
passport.use(new Localstrategy(User.authenticate()));


// GET HOME PAGE . . 
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "Homepage",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

/* GET CREATE page. */
router.get('/create', function (req, res, next) {
  res.render('create', {
    title: 'craete',
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

/* GET SHOW ALL page. */
router.get('/show', function (req, res, next) {
  res.render('show', {
    title: 'showall',
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});
/* GET signin page. */
router.get('/signin', function (req, res, next) {
  res.render('signin', {
    title: 'signin',
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

/* POST signup page. */
router.post('/signup', function (req, res, next) {
  const { username, email, contact, password } = req.body;
  User.register({ username, email, contact }, password)
    .then((user) => {
      res.redirect("/signin")

    })
    .catch((err) =>
      res.send(err));
});

/* GET signup page. */
router.get('/signup', function (req, res, next) {
  res.render('signup', {
    title: 'signup',
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});


// Get Update Page .. 
router.get("/update/:id", isLoggedIn, async function (req, res, next) {
  res.render("profile", {
    title: "Update",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});


/* GET Profile page. */
router.get('/profile', isLoggedIn, function (req, res, next) {
  res.render('profile', {
    title: 'profile',
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});



// post updateUser/:id page .. . 
router.post("/update/:id", isLoggedIn, async function (req, res, next) {
  try {
    const { username, email, contact, linkedin, github, behance } =
      req.body;

    const updatedUserInfo = {
      username,
      email,
      contact,
      links: { linkedin, github, behance },
    };

    await User.findOneAndUpdate(req.params.id, updatedUserInfo);
    res.redirect("/update/" + req.params.id);
  } catch (error) {
    res.send(err);
  }
});

// POST SIGN IN  ROUTE

router.post(
  "/signin",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/signin",
  }),
  function (req, res, next) { }
);

// GET SIGNOUT PAGE 
router.get("/signout", function (req, res, next) {
  req.logout(() => {
    res.redirect("/signin");
  });
});

// GET RESET_PASSWORD PAGE 
router.get("/reset-password", isLoggedIn, function (req, res, next) {
  res.render("reset", {
    title: "Reset-Password",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

// POST RESET_PASSWORD PAGE 
router.post("/reset-password", isLoggedIn, async function (req, res, next) {
  try {
    await req.user.changePassword(
      req.body.oldPassword,
      req.body.newPassword
    );
    await req.user.save();
    res.redirect("/profile");
  } catch (error) {
    res.send(err);
  }
});
router.get("/forget-password", function (req, res, next) {
  res.render("forget", {
    title: "Forget-Password",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });

})


// node mailer coding 

router.get("/forgetpassword/:id", async function (req, res, next) {
  res.render("getpassword", { userId: req.params.id })
})




router.post("/send-mail", async function (req, res, next) {
  const user = await User.findOne({ email: req.body.email });
  console.log(user)
  if (!req.body.email && !user) return res.send("user not found");
  const mailurl = `${req.protocol}://${req.get("host")}/forgetpassword/${user._id
    }`;
  console.log(mailurl)
  const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: "tarunpatidar742@gmail.com",
      pass: "bdmvsrygowurvfvy",
    },
  });

  const mailOptions = {
    from: "Tej Pvt. Ltd.<tarunpatidar742@gmail.com>",
    to: req.body.email,
    subject: "Password Reset Link",
    text: "Do not share this link to anyone.",
    html: `<a href=${mailurl}>Password Reset Link</a>`,
  };

  transport.sendMail(mailOptions, (err, info) => {
    if (err) return res.send(err);
    console.log(info);

    return res.send(
      "<h1 style='text-align:center;color: tomato; margin-top:10%'><span style='font-size:60px;'>✔️</span> <br />Email Sent! Check your inbox , <br/>check spam in case not found in inbox.</h1><br> <a href='/signin'>Signin</a> "
    );
  });
  // res.redirect("/signin")
});

// router.post("/send-mail/", isLoggedIn, function (req, res, next) {
// how to send mail
// redirect to verify otp
// });

// router.get("/verify-otp/:id", isLoggedIn, function (req, res, next) {
//     open the page of verifyopt and  password
// });

router.post("/confirmpassword/:id", async function (req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    await user.setPassword(req.body.confirm_password);
    await user.save();
    res.redirect("/signin");
  } catch (err) {
    console.log(err)
    res.send(err);
  }

});


// Post upload page. .. 
router.post("/upload", isLoggedIn, async function (req, res, next) {
  upload(req, res, function (err) {
    if (err) {
      console.log("ERROR>>>>>", err.message);
      res.send(err.message);
    }
    if (req.file) {
      fs.unlinkSync("./public/images/" + req.user.avatar);
      req.user.avatar = req.file.filename;
      req.user
        .save()
        .then(() => {
          res.redirect("/update/" + req.user._id);
        })
        .catch((err) => {
          res.send(err);
        });
    }
  });
});


// ----------------------------------resumes

router.get("/create", isLoggedIn, function (req, res, next) {
  res.render("create", {
    title: "Create",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});


// education ......................
router.get("/education", isLoggedIn, function (req, res, next) {
  res.render("Resume/Education", {
    title: "Education",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

router.post("/add-edu", isLoggedIn, async function (req, res, next) {
  req.user.education.push(req.body);
  await req.user.save();
  res.redirect("/education");
});

router.get("/delete-edu/:index", isLoggedIn, async function (req, res, next) {
  const eduCopy = [...req.user.education];
  eduCopy.splice(req.params.index, 1);
  req.user.education = [...eduCopy];
  await req.user.save();
  res.redirect("/education");
});



// skill......................
router.get("/skill", isLoggedIn, function (req, res, next) {
  res.render("Resume/skill", {
    title: "skill",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

router.post("/add-skill", isLoggedIn, async function (req, res, next) {
  req.user.skill.push(req.body);
  await req.user.save();
  res.redirect("/skill");
});

router.get("/delete-skill/:index", isLoggedIn, async function (req, res, next) {
  const eduCopy = [...req.user.skill];
  eduCopy.splice(req.params.index, 1);
  req.user.skill = [...eduCopy];
  await req.user.save();
  res.redirect("/skill");
});




// MAKE A FUNCTION ISLOGGEDIN 
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/signin")
  }
}


// project ......................
router.get("/project", isLoggedIn, function (req, res, next) {
  res.render("Resume/project", {
    title: "project",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

router.post("/add-project", isLoggedIn, async function (req, res, next) {
  req.user.project.push(req.body);
  await req.user.save();
  res.redirect("/project");
});

router.get("/delete-project/:index", isLoggedIn, async function (req, res, next) {
  const eduCopy = [...req.user.project];
  eduCopy.splice(req.params.index, 1);
  req.user.project = [...eduCopy];
  await req.user.save();
  res.redirect("/project");
});

// experience ......................
router.get("/experience", isLoggedIn, function (req, res, next) {
  res.render("Resume/experience", {
    title: "Experience",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

router.post("/add-experience", isLoggedIn, async function (req, res, next) {
  req.user.experience.push(req.body);
  await req.user.save();
  res.redirect("/experience");
});

router.get("/delete-experience/:index", isLoggedIn, async function (req, res, next) {
  const eduCopy = [...req.user.experience];
  eduCopy.splice(req.params.index, 1);
  req.user.experience = [...eduCopy];
  await req.user.save();
  res.redirect("/experience");
});




// Interests ......................
router.get("/interest", isLoggedIn, function (req, res, next) {
  res.render("Resume/interest", {
    title: "Interest",
    isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

router.post("/add-interest", isLoggedIn, async function (req, res, next) {
  req.user.interest.push(req.body);
  await req.user.save();
  res.redirect("/interest");
});

router.get("/delete-interest/:index", isLoggedIn, async function (req, res, next) {
  const eduCopy = [...req.user.interest];
  eduCopy.splice(req.params.index, 1);
  req.user.interest = [...eduCopy];
  await req.user.save();
  res.redirect("/interest");
});


module.exports = router;
