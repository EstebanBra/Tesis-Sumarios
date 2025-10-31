BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Persona] (
    [Rut] VARCHAR(12) NOT NULL,
    [Nombre] VARCHAR(100) NOT NULL,
    [Correo] VARCHAR(100) NOT NULL,
    [Telefono] VARCHAR(20) NOT NULL,
    CONSTRAINT [Persona_pkey] PRIMARY KEY CLUSTERED ([Rut])
);

-- CreateTable
CREATE TABLE [dbo].[Participante_Caso] (
    [ID_PC] INT NOT NULL IDENTITY(1,1),
    [Rut] VARCHAR(12) NOT NULL,
    [Tipo_PC] VARCHAR(50) NOT NULL,
    CONSTRAINT [Participante_Caso_pkey] PRIMARY KEY CLUSTERED ([ID_PC])
);

-- CreateTable
CREATE TABLE [dbo].[Denuncia] (
    [ID_Denuncia] INT NOT NULL IDENTITY(1,1),
    [Rut] VARCHAR(12) NOT NULL,
    [ID_TipoDe] INT NOT NULL,
    [ID_EstadoDe] INT NOT NULL,
    [Fecha_Inicio] DATE NOT NULL,
    [Relato_Hechos] TEXT NOT NULL,
    [Ubicacion] VARCHAR(200),
    CONSTRAINT [Denuncia_pkey] PRIMARY KEY CLUSTERED ([ID_Denuncia])
);

-- CreateTable
CREATE TABLE [dbo].[Tipo_Denuncia] (
    [ID_TipoDe] INT NOT NULL IDENTITY(1,1),
    [Nombre] VARCHAR(100) NOT NULL,
    [Area] VARCHAR(100) NOT NULL,
    CONSTRAINT [Tipo_Denuncia_pkey] PRIMARY KEY CLUSTERED ([ID_TipoDe])
);

-- CreateTable
CREATE TABLE [dbo].[Estado_Denuncia] (
    [ID_EstadoDe] INT NOT NULL IDENTITY(1,1),
    [Tipo_Estado] VARCHAR(50) NOT NULL,
    CONSTRAINT [Estado_Denuncia_pkey] PRIMARY KEY CLUSTERED ([ID_EstadoDe])
);

-- CreateTable
CREATE TABLE [dbo].[Historial_Estado] (
    [ID_Denuncia] INT NOT NULL,
    [ID_EstadoDe] INT NOT NULL,
    [Fecha] DATETIME NOT NULL,
    CONSTRAINT [Historial_Estado_pkey] PRIMARY KEY CLUSTERED ([ID_Denuncia],[ID_EstadoDe])
);

-- CreateTable
CREATE TABLE [dbo].[Participante_Denuncia] (
    [ID_PD] INT NOT NULL IDENTITY(1,1),
    [ID_Denuncia] INT NOT NULL,
    [Rut] VARCHAR(12) NOT NULL,
    [Nombre_PD] VARCHAR(100) NOT NULL,
    CONSTRAINT [Participante_Denuncia_pkey] PRIMARY KEY CLUSTERED ([ID_PD])
);

-- CreateTable
CREATE TABLE [dbo].[Per_Par_Den] (
    [ID_PD] INT NOT NULL IDENTITY(1,1),
    [ID_Denuncia] INT NOT NULL,
    [Rut] VARCHAR(12) NOT NULL,
    [Cargo_actual] VARCHAR(100) NOT NULL,
    CONSTRAINT [Per_Par_Den_pkey] PRIMARY KEY CLUSTERED ([ID_PD])
);

-- CreateTable
CREATE TABLE [dbo].[MedidaCautelar] (
    [ID_MC] INT NOT NULL IDENTITY(1,1),
    [ID_Denuncia] INT NOT NULL,
    [Fecha_Inicio] DATE NOT NULL,
    [Fecha_Fin] DATE NOT NULL,
    [Detalle] TEXT NOT NULL,
    CONSTRAINT [MedidaCautelar_pkey] PRIMARY KEY CLUSTERED ([ID_MC])
);

-- CreateTable
CREATE TABLE [dbo].[Tipo_Cautelar] (
    [ID_MC] INT NOT NULL,
    [Nombre] VARCHAR(100) NOT NULL,
    CONSTRAINT [Tipo_Cautelar_pkey] PRIMARY KEY CLUSTERED ([ID_MC])
);

-- CreateTable
CREATE TABLE [dbo].[Hitos] (
    [ID_Hitos] INT NOT NULL IDENTITY(1,1),
    [ID_PC] INT NOT NULL,
    [Nombre] VARCHAR(100) NOT NULL,
    [Descripcion] TEXT,
    CONSTRAINT [Hitos_pkey] PRIMARY KEY CLUSTERED ([ID_Hitos])
);

-- CreateTable
CREATE TABLE [dbo].[Tipo_Hito] (
    [ID_Tipo_Hito] INT NOT NULL IDENTITY(1,1),
    [ID_Hitos] INT NOT NULL,
    [Nombre] VARCHAR(100) NOT NULL,
    CONSTRAINT [Tipo_Hito_pkey] PRIMARY KEY CLUSTERED ([ID_Tipo_Hito])
);

-- CreateTable
CREATE TABLE [dbo].[Archivo] (
    [ID_Archivo] INT NOT NULL IDENTITY(1,1),
    [ID_Hitos] INT NOT NULL,
    [Archivo] VARCHAR(255) NOT NULL,
    CONSTRAINT [Archivo_pkey] PRIMARY KEY CLUSTERED ([ID_Archivo])
);

-- AddForeignKey
ALTER TABLE [dbo].[Participante_Caso] ADD CONSTRAINT [Participante_Caso_Rut_fkey] FOREIGN KEY ([Rut]) REFERENCES [dbo].[Persona]([Rut]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Denuncia] ADD CONSTRAINT [Denuncia_ID_TipoDe_fkey] FOREIGN KEY ([ID_TipoDe]) REFERENCES [dbo].[Tipo_Denuncia]([ID_TipoDe]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Denuncia] ADD CONSTRAINT [Denuncia_ID_EstadoDe_fkey] FOREIGN KEY ([ID_EstadoDe]) REFERENCES [dbo].[Estado_Denuncia]([ID_EstadoDe]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Historial_Estado] ADD CONSTRAINT [Historial_Estado_ID_Denuncia_fkey] FOREIGN KEY ([ID_Denuncia]) REFERENCES [dbo].[Denuncia]([ID_Denuncia]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Historial_Estado] ADD CONSTRAINT [Historial_Estado_ID_EstadoDe_fkey] FOREIGN KEY ([ID_EstadoDe]) REFERENCES [dbo].[Estado_Denuncia]([ID_EstadoDe]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Participante_Denuncia] ADD CONSTRAINT [Participante_Denuncia_ID_Denuncia_fkey] FOREIGN KEY ([ID_Denuncia]) REFERENCES [dbo].[Denuncia]([ID_Denuncia]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Per_Par_Den] ADD CONSTRAINT [Per_Par_Den_Rut_fkey] FOREIGN KEY ([Rut]) REFERENCES [dbo].[Persona]([Rut]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Per_Par_Den] ADD CONSTRAINT [Per_Par_Den_ID_Denuncia_fkey] FOREIGN KEY ([ID_Denuncia]) REFERENCES [dbo].[Denuncia]([ID_Denuncia]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MedidaCautelar] ADD CONSTRAINT [MedidaCautelar_ID_Denuncia_fkey] FOREIGN KEY ([ID_Denuncia]) REFERENCES [dbo].[Denuncia]([ID_Denuncia]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tipo_Cautelar] ADD CONSTRAINT [Tipo_Cautelar_ID_MC_fkey] FOREIGN KEY ([ID_MC]) REFERENCES [dbo].[MedidaCautelar]([ID_MC]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Hitos] ADD CONSTRAINT [Hitos_ID_PC_fkey] FOREIGN KEY ([ID_PC]) REFERENCES [dbo].[Participante_Caso]([ID_PC]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tipo_Hito] ADD CONSTRAINT [Tipo_Hito_ID_Hitos_fkey] FOREIGN KEY ([ID_Hitos]) REFERENCES [dbo].[Hitos]([ID_Hitos]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Archivo] ADD CONSTRAINT [Archivo_ID_Hitos_fkey] FOREIGN KEY ([ID_Hitos]) REFERENCES [dbo].[Hitos]([ID_Hitos]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
