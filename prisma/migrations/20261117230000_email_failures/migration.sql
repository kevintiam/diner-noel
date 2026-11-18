-- Échecs d'envoi des courriels au participant, visibles des organisateurs (AD-10).
-- Évolution additive : aucune table existante n'est modifiée.
-- CreateEnum
CREATE TYPE "EmailKind" AS ENUM ('RECEIPT', 'CONFIRMATION', 'REFUSAL');

-- CreateTable
CREATE TABLE "EmailFailure" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "kind" "EmailKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "EmailFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailFailure_reservationId_idx" ON "EmailFailure"("reservationId");

-- CreateIndex
CREATE INDEX "EmailFailure_resolvedAt_idx" ON "EmailFailure"("resolvedAt");

-- AddForeignKey
ALTER TABLE "EmailFailure" ADD CONSTRAINT "EmailFailure_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFailure" ADD CONSTRAINT "EmailFailure_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "Organizer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

