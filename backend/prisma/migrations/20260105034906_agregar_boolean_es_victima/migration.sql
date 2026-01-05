BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Denuncia] ADD [denuncianteEsVictima] BIT NOT NULL CONSTRAINT [Denuncia_denuncianteEsVictima_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[Participante_Denuncia] DROP CONSTRAINT [Participante_Denuncia_Tipo_PD_df];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
