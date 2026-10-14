-- CreateTable
CREATE TABLE "boards" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "member_id" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "board_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" VARCHAR(7) NOT NULL DEFAULT '#fff3a3',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_board_id_idx" ON "notes"("board_id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
