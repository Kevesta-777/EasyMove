import { db } from "./db";
import { sql } from "drizzle-orm";

async function resetUsersTable() {
  try {
    console.log("Dropping users table...");
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    console.log("Users table dropped successfully");
  } catch (error) {
    console.error("Error resetting users table:", error);
    throw error;
  }
}

// Run the reset
resetUsersTable()
  .then(() => {
    console.log("Database reset complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database reset failed:", error);
    process.exit(1);
  }); 