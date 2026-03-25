import { Router, type IRouter } from "express";
import { db, contactsTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contacts", async (req, res) => {
  try {
    const body = SubmitContactBody.parse(req.body);
    const [contact] = await db
      .insert(contactsTable)
      .values({
        name: body.name,
        email: body.email,
        phone: body.phone,
        message: body.message,
      })
      .returning();
    res.status(201).json({ id: contact.id, message: "Спасибо! Мы свяжемся с вами в ближайшее время." });
  } catch (err) {
    console.error("Error submitting contact:", err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
