import express from "express";
const app = express();
import path from "path";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
mongoose
	.connect("mongodb://127.0.0.1:27017", {
		dbName: "backend",
	})
	.then((c) => console.log("Database Connected"))
	.catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
	name: String,
	email: String,
	password: String,
});

const User = mongoose.model("User", userSchema);

//Middle Wares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Specify View Engine
// This engine is used to pass data as website needs to be dynamic
// No need to add extension to render
app.set("view engine", "ejs");

// Function
const isAuthenticated = async (req, res, next) => {
	const { token } = req.cookies;
	if (token) {
		const decoded = jwt.verify(token, "fdsfgsudfjk");
		req.user = await User.findById(decoded._id);
		next();
	} else {
		res.redirect("/login");
	}
};

app.get("/", isAuthenticated, (req, res) => {
	console.log(req.user);
	res.render("logout", { name: req.user.name });
});

app.get("/login", (req, res) => {
	res.render("login");
});

app.get("/logout", async (req, res) => {
	res.cookie("token", null, {
		httpOnly: true,
		expires: new Date(Date.now()),
	});
	res.redirect("/");
});

app.get("/register", (req, res) => {
	res.render("register");
});

app.post("/login", async (req, res) => {
	const { email, password } = req.body;

	let user = await User.findOne({ email });

	if (!user) {
		return res.redirect("register");
	}

	const isMatch = await bcrypt.compare(password, user.password);

	if (!isMatch) {
		return res.render("login", {
			email,
			message: "Incorrect Password",
		});
	}
	// else
	const token = jwt.sign({ _id: user._id }, "fdsfgsudfjk");

	res.cookie("token", token, {
		httpOnly: true,
		expires: new Date(Date.now() + 60 * 1000),
	});
	res.redirect("/");
});

app.post("/register", async (req, res) => {
	const { name, email, password } = req.body;

	const userFind = await User.findOne({ email });
	if (userFind) {
		return res.redirect("/login");
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const user = await User.create({
		name,
		email,
		password: hashedPassword,
	});

	const token = jwt.sign({ _id: user._id }, "fdsfgsudfjk");
	// console.log(token);

	res.cookie("token", token, {
		httpOnly: true,
		expires: new Date(Date.now() + 60 * 1000),
	});
	res.redirect("/");
});

app.listen(5000, () => {
	console.log(`Server is Running on Port 5000`);
});
