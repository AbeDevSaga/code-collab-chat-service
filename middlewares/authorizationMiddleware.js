const jwt = require("jsonwebtoken");
const Project = require("../models/project");

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  console.log("isAdmin", req.user?.role);
  if (req.user?.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

const isSuperAdmin = async (req, res, next) => {
  console.log("isSuperAdmin", req.user?.role);
  if (req.user?.role !== "Super Admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

// Middleware to check if user is a project member
const isProjectMemeber = (req, res, next) => {
  const userId = req.user.id;
  const project = req.project; // Assuming the project is attached to the request object
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }
  if (!project.members.includes(userId)) {
    return res.status(403).json({ message: "Forbidden: Not a project member" });
  }
  next();
};

const isProjectExist = (req, res, next) => {
  const projectId = req.params.projectId;
  Project.findById(projectId, (err, project) => {
    if (err || !project) {
      return res.status(404).json({ message: "Project not found" });
    }
    req.project = project; // Attach the project to the request object
    next();
  });
}

module.exports = { isAuthenticated, isAdmin, isSuperAdmin, isProjectMemeber, isProjectExist };
