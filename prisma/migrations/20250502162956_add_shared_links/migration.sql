-- CreateTable
CREATE TABLE "SharedLink" (
    "id" TEXT NOT NULL,
    "folderId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SharedLink" ADD CONSTRAINT "SharedLink_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
