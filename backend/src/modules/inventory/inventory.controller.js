// =====================================================================
// inventory.controller.js — CONTROLLER inventory / gudang
// =====================================================================

import * as service from "./inventory.service.js";
import { ValidationError } from "./inventory.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

// ----- ITEM -----
export async function getItems(req, res) {
  try {
    res.json(await service.getItems({ q: req.query.q, kategori: req.query.kategori }));
  } catch (err) {
    handleError(res, err);
  }
}

export async function getItem(req, res) {
  try {
    res.json(await service.getItem(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function createItem(req, res) {
  try {
    res.status(201).json(await service.createItem(req.body));
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateItem(req, res) {
  try {
    res.json(await service.updateItem(req.params.id, req.body));
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteItem(req, res) {
  try {
    res.json(await service.deleteItem(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function lowStock(req, res) {
  try {
    res.json(await service.getLowStock());
  } catch (err) {
    handleError(res, err);
  }
}

// ----- MOVEMENT -----
export async function getMovements(req, res) {
  try {
    res.json(await service.getMovements(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function createMovement(req, res) {
  try {
    res.status(201).json(await service.createMovement(req.body, req.user));
  } catch (err) {
    handleError(res, err);
  }
}
