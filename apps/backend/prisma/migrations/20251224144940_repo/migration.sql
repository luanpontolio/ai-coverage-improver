/*
  Warnings:

  - A unique constraint covering the columns `[provider,owner,name]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Repository_provider_owner_name_key" ON "Repository"("provider", "owner", "name");
