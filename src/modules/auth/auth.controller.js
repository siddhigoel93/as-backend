const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../users/user.model");
const sendEmail = require("../../utils/sendEmail");

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "student",
      isApproved: role === "teacher" || role === "parent" ? false : true
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required"
      });
    }

    const user = await User.findOne({ email });

   if (!user) {
    return res.status(404).json({
        success: false,
        message: "User not found"
    });
}

    if (!user.isActive) {
    return res.status(403).json({
        success: false,
        message: "Account is deactivated"
    });
}

if (!user.isApproved) {
    return res.status(403).json({
        success: false,
        message: "Account is pending admin approval"
    });
}

  

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Invalid role selected"
      });
    }

   
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// const nodemailer = require("nodemailer");

const forgotPassword = async (req,res)=>{
  try{
   const {email}=req.body;

   const user=await User.findOne({email});

   if(!user)
      return res.status(404).json({
          success:false,
          message:"User not found"
      });

      if (!user.isApproved) {
    return res.status(403).json({
        success: false,
        message: "Account is pending admin approval"
    });
}

if (!user.isActive) {
    return res.status(403).json({
        success: false,
        message: "Account is deactivated"
    });
}

   const otp=Math.floor(100000+Math.random()*900000).toString();

   user.otp=otp;
   user.otpExpiry=Date.now()+5*60*1000;

   await user.save();

   

  //  const transporter=nodemailer.createTransport({
  //     service:"gmail",
  //     auth:{
  //        user:process.env.EMAIL_USER,
  //        pass:process.env.EMAIL_PASS
  //     }
  //  });

  //  await transporter.sendMail({
  //     from:process.env.EMAIL_USER,
  //     to:email,
  //     subject:"Password Reset OTP",
  //     text:`Your OTP is ${otp}`
  //  });

 await sendEmail(
    email,
    "ERP Password Reset OTP",
`Hello,

Your One-Time Password (OTP) for resetting your ERP account password is:

${otp}

This OTP is valid for 5 minutes.

If you did not request a password reset, please ignore this email.

Regards,
ERP Team`
);

   res.json({
      success:true,
      message:"OTP sent successfully"
   });
  }catch(error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const verifyOtp=async(req,res)=>{
  try{

 const {email,otp}=req.body;

 const user=await User.findOne({email});

 if(!user)
    return res.status(404).json({
      success:false,
      message:"User not found"
    });

 if (!user.otp) {
    return res.status(400).json({
        success: false,
        message: "No OTP requested"
    });
}

if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
    return res.status(400).json({
        success: false,
        message: "OTP expired"
    });
}

if (user.otp !== otp) {
    return res.status(400).json({
        success: false,
        message: "Invalid OTP"
    });
}

 res.json({
    success:true,
    message:"OTP verified"
 });
  }catch(error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const resetPassword=async(req,res)=>{
  try{

const { email, otp, password } = req.body;

const user = await User.findOne({ email });

if (!user) {
    return res.status(404).json({
        success: false,
        message: "User not found"
    });
}

if (!user.otp) {
    return res.status(400).json({
        success: false,
        message: "OTP verification required"
    });
}


if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
    return res.status(400).json({
        success: false,
        message: "OTP expired"
    });
}

if (user.otp !== otp) {
    return res.status(400).json({
        success: false,
        message: "Invalid OTP"
    });
}


user.password=await bcrypt.hash(password,10);

user.otp=null;
user.otpExpiry=null;

await user.save();

res.json({
 success:true,
 message:"Password updated successfully"
});
  }catch(error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }

};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
};

module.exports={
 registerUser,
 loginUser,
 getMe,
 forgotPassword,
 verifyOtp,
 resetPassword
}