-- CreateTable
CREATE TABLE "CourseOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "amount" DECIMAL(12,0) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "authority" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseOrder_userId_idx" ON "CourseOrder"("userId");

-- CreateIndex
CREATE INDEX "CourseOrder_courseId_idx" ON "CourseOrder"("courseId");

-- CreateIndex
CREATE INDEX "CourseOrder_authority_idx" ON "CourseOrder"("authority");
