// =====================================================================
// procurement.controller.js — CONTROLLER pengadaan (PR/PO)
// =====================================================================

import * as service from "./procurement.service.js";
import { ValidationError } from "./procurement.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function suppliers(req, res) {
  try {
    res.json(await service.getSuppliers());
  } catch (err) {
    handleError(res, err);
  }
}

export async function list(req, res) {
  try {
    res.json(await service.list());
  } catch (err) {
    handleError(res, err);
  }
}

export async function detail(req, res) {
  try {
    res.json(await service.getById(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function create(req, res) {
  try {
    res.status(201).json(await service.create(req.body, req.user));
  } catch (err) {
    handleError(res, err);
  }
}

export async function submit(req, res) {
  try {
    res.json(await service.submit(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function approve(req, res) {
  try {
    res.json(await service.approve(req.params.id, req.user));
  } catch (err) {
    handleError(res, err);
  }
}

export async function receive(req, res) {
  try {
    res.json(await service.receive(req.params.id, req.user));
  } catch (err) {
    handleError(res, err);
  }
}

export async function cancel(req, res) {
  try {
    res.json(await service.cancel(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}
