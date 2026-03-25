import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { CreateOrderBody } from "@workspace/api-zod";
import { sendOrderNotification } from "../lib/telegram";
import { sendEmailNotification } from "../lib/email";

const router: IRouter = Router();

router.get("/orders", async (_req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const body = CreateOrderBody.parse(req.body);
    const [order] = await db
      .insert(ordersTable)
      .values({
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        serviceType: body.serviceType,
        notes: body.notes,
        status: "pending",
        inn: body.inn,
        companyName: body.companyName,
        companyFullName: body.companyFullName,
        companyKpp: body.companyKpp,
        companyOgrn: body.companyOgrn,
        companyLegalAddress: body.companyLegalAddress,
        companyDirector: body.companyDirector,
        contactMethod: body.contactMethod,
      })
      .returning();

    // Send notifications non-blocking
    const notifPayload = {
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address,
      serviceType: body.serviceType,
      notes: body.notes,
      inn: body.inn,
      companyName: body.companyName,
      contactMethod: body.contactMethod,
    };
    sendOrderNotification(notifPayload).catch(() => {});
    sendEmailNotification(notifPayload).catch(() => {});

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
