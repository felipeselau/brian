/*
  Warnings:

  - You are about to drop the column `requestId` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the `requests` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ticketId` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketId` to the `comments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED', 'WAITING', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_requestId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_requestId_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_createdById_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_projectId_fkey";

-- DropIndex
DROP INDEX "attachments_requestId_idx";

-- DropIndex
DROP INDEX "comments_requestId_idx";

-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "requestId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "requestId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "project_members" ADD COLUMN     "canCreateTickets" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "requests";

-- DropEnum
DROP TYPE "RequestStatus";

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'BACKLOG',
    "projectId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "estimatedHours" DOUBLE PRECISION,
    "loggedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isClientRequest" BOOLEAN NOT NULL DEFAULT false,
    "approvals" JSONB NOT NULL,
    "lifecycleLog" JSONB NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tickets_projectId_idx" ON "tickets"("projectId");

-- CreateIndex
CREATE INDEX "tickets_assignedToId_idx" ON "tickets"("assignedToId");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "attachments_ticketId_idx" ON "attachments"("ticketId");

-- CreateIndex
CREATE INDEX "comments_ticketId_idx" ON "comments"("ticketId");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
