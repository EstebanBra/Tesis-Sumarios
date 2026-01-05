/*
  Warnings:

  - A unique constraint covering the columns `[token_seguimiento]` on the table `Denuncia` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Denuncia] ADD [token_seguimiento] VARCHAR(255);

-- CreateIndex
ALTER TABLE [dbo].[Denuncia] ADD CONSTRAINT [Denuncia_token_seguimiento_key] UNIQUE NONCLUSTERED ([token_seguimiento]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
