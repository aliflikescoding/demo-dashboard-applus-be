const path = require("path");
const bcrypt = require("bcrypt");

const envFilePath = path.resolve(__dirname, "../../.env");

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envFilePath);
}

const prisma = require("../../lib/prisma");

const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const createAdmin = async () => {
  try {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_USERNAME and ADMIN_PASSWORD are required to generate the admin user.",
      );
    }

    const existingAdmin = await prisma.user.findFirst();
    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD);
    const admin = await prisma.user.create({
      data: {
        username: process.env.ADMIN_USERNAME,
        password: hashedPassword,
        isAdmin: true,
      },
    });

    if (admin) {
      console.log(
        "Admin created successfully with the username: ",
        admin.username,
      );
    } else {
      console.log("Failed to create admin");
    }
  } catch (error) {
    // Changed from res.status(500).json to console.error
    console.error("Error creating admin:", error.message);
    process.exit(1); // Exit with error code
  }
};

const main = async () => {
  try {
    await createAdmin();
  } catch (error) {
    console.error("Error in main:", error);
  } finally {
    await prisma.$disconnect();
  }
};

main();
