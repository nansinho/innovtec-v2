-- Migration: Remove duplicate REX entries from the documents table.
-- REX fiches are now read directly from the rex table via getDocuments(),
-- so these denormalized copies are no longer needed.
-- Run this ONCE after deploying the new code.

DELETE FROM documents WHERE category = 'rex';
