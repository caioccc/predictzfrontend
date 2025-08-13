
import { api } from "@/api";
import { Alert, Button, Container, FileInput, Group, Modal, Stack, Text, Title } from "@mantine/core";
import { IconDownload, IconTrash, IconUpload } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { IconDatabaseImport } from "@tabler/icons-react";

export default function DataExportImportPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collectModalOpen, setCollectModalOpen] = useState(false);

  const handleCollectRange = async () => {
    setCollecting(true);
    setImportResult(null);
    try {
      const res = await api.post("/scrape/range/");
      setImportResult(res.data.detail || "Coleta concluída.");
    } catch {
      setImportResult("Erro ao coletar dados.");
    }
    setCollecting(false);
    setCollectModalOpen(false);
  };

  const handleDownload = async () => {
    try {
      const res = await api.get("/data/", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "dados_predictz.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setImportResult("Erro ao exportar CSV.");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/data/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(res.data.detail || "Importação concluída.");
    } catch (err: unknown) {
      setImportResult("Erro ao importar CSV.");
    }
    setImporting(false);
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    setImportResult(null);
    try {
      await api.delete("/data/delete-all/");
      setImportResult("Todos os dados foram excluídos.");
    } catch {
      setImportResult("Erro ao excluir os dados.");
    }
    setDeleting(false);
    setModalOpen(false);
  };

  return (
    <Container size="sm" py={32}>
      <Title order={2} mb={24}>Exportar / Importar Dados</Title>
      <Stack gap={24}>
        <Group>
          <Button leftSection={<IconDownload size={18} />} onClick={handleDownload} color="blue" variant="light">
            Baixar CSV
          </Button>
          <Button leftSection={<IconTrash size={18} />} color="red" variant="light" onClick={() => setModalOpen(true)}>
            Excluir dados
          </Button>
          <Button leftSection={<IconDatabaseImport size={18} />} color="orange" variant="light" onClick={() => setCollectModalOpen(true)}>
            Coletar dados
          </Button>
          <Modal opened={collectModalOpen} onClose={() => setCollectModalOpen(false)} title="Confirmação de Coleta" centered>
            <Text mb={16} color="orange" fw={700}>Deseja coletar dados de jogos do mês passado até hoje + 3 dias?<br />Esta ação pode demorar alguns minutos.</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCollectModalOpen(false)} disabled={collecting}>Cancelar</Button>
              <Button color="orange" leftSection={<IconDatabaseImport size={16} />} loading={collecting} onClick={handleCollectRange}>Confirmar Coleta</Button>
            </Group>
          </Modal>
        </Group>
        <Group>
          <FileInput
            ref={fileInputRef}
            value={file}
            onChange={setFile}
            accept=".csv"
            placeholder="Selecione o arquivo CSV para importar"
          />
          <Button leftSection={<IconUpload size={18} />} onClick={handleImport} loading={importing} color="green" variant="light">
            Importar CSV
          </Button>
        </Group>
        {importResult && (
          <Alert color={importResult.includes("Erro") ? "red" : "green"}>{importResult}</Alert>
        )}
        <Text size="sm" color="gray">
          O arquivo exportado pode ser usado para backup/restauração completa dos dados de ligas, times e partidas.
        </Text>
      </Stack>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Confirmação" centered>
        <Text mb={16} color="red" fw={700}>Tem certeza que deseja excluir <u>TODOS</u> os dados do sistema? Esta ação não pode ser desfeita!</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setModalOpen(false)} disabled={deleting}>Cancelar</Button>
          <Button color="red" leftSection={<IconTrash size={16} />} loading={deleting} onClick={handleDeleteAll}>Confirmar Exclusão</Button>
        </Group>
      </Modal>
    </Container>
  );
}
