import { db } from "@/lib/db";

async function main() {
  try {
    await db.category.createMany({
      data: [
        { name: "Computer Science" },
        { name: "Music" },
        { name: "Health & Fitness" },
        { name: "Photography & Video" },
        { name: "Accounting" },
        { name: "Engineering" },
        { name: "Personal Development" },
        { name: "Marketing" },
        { name: "Lifestyle" },
      ],
    });

    console.log("Database seeded successfully");
  } catch (error) {
    console.log("Error sending the database categories", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
