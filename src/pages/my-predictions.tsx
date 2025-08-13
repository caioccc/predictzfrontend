/* eslint-disable  @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { api } from "../api";
import { Container, Title, Card, Group, Text, Loader, Center, Pagination, Menu, ActionIcon, Badge, Button, Stack, Modal, NumberInput } from "@mantine/core";
import { IconBallFootball, IconDotsVertical, IconEdit } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useDisclosure } from "@mantine/hooks";

export default function MyPredictionsPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const router = useRouter();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editMatch, setEditMatch] = useState<any | null>(null);
  const [editValues, setEditValues] = useState({
    user_predicted_home_score: null,
    user_predicted_away_score: null,
    actual_home_score: null,
    actual_away_score: null,
  });

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/my-predictions/?page=${page}`);
        setMatches(res.data.results ?? []);
        setTotal(res.data.count ?? 0);
      } catch {
        setMatches([]);
        setTotal(0);
      }
      setLoading(false);
    };
    fetchMatches();
  }, [page]);

  const handleEdit = (match: any) => {
    setEditMatch(match);
    setEditValues({
      user_predicted_home_score: match.user_predicted_home_score ?? "",
      user_predicted_away_score: match.user_predicted_away_score ?? "",
      actual_home_score: match.actual_home_score ?? "",
      actual_away_score: match.actual_away_score ?? "",
    });
    openModal();
  };

  const handleSave = async () => {
    if (!editMatch) return;
    setLoading(true);
    try {
      // Atualiza placar real
      const realPayload: any = {};
      if (editValues.actual_home_score !== "" && editValues.actual_home_score !== null) {
        realPayload.actual_home_score = editValues.actual_home_score;
      }
      if (editValues.actual_away_score !== "" && editValues.actual_away_score !== null) {
        realPayload.actual_away_score = editValues.actual_away_score;
      }
      if (Object.keys(realPayload).length > 0) {
        await api.patch(`/matches/${editMatch.id}/`, realPayload);
      }
      // Atualiza previsão do usuário
      const predPayload: any = {};
      if (editValues.user_predicted_home_score !== "" && editValues.user_predicted_home_score !== null) {
        predPayload.user_predicted_home_score = editValues.user_predicted_home_score;
      }
      if (editValues.user_predicted_away_score !== "" && editValues.user_predicted_away_score !== null) {
        predPayload.user_predicted_away_score = editValues.user_predicted_away_score;
      }
      if (Object.keys(predPayload).length > 0) {
        await api.patch(`/matches/${editMatch.id}/update-prediction/`, predPayload);
      }
      closeModal();
      // Recarrega página
      const res = await api.get(`/my-predictions/?page=${page}`);
      setMatches(res.data.results ?? []);
      setTotal(res.data.count ?? 0);
    } catch (err) {
      // Tratar erro
    }
    setLoading(false);
  };

  return (
    <Container size="md" py={32}>
      <Title order={2} mb={24}><IconBallFootball style={{ marginRight: 8 }} /> Minhas Partidas Palpitadas</Title>
      {loading ? (
        <Center py={40}><Loader color="blue" size="lg" /></Center>
      ) : matches.length === 0 ? (
        <Text color="gray">Nenhuma partida encontrada.</Text>
      ) : (
        <>
          <Stack gap={16}>
            {matches.map((m: any) => {
              const status = m.status;
              return (
                <Card key={m.id} withBorder radius="md" shadow="xs" className="relative">
                  <Group justify="space-between" align="flex-start">
                    <Group gap={8} align="center">
                      <Button
                        variant="subtle"
                        color="blue"
                        size="xs"
                        radius="md"
                        style={{ fontWeight: 600, padding: '0 8px' }}
                        onClick={() => router.push(`/team/${m.home_team_id}`)}
                      >
                        {m.home_team}
                      </Button>
                      <Text fw={600} size="md">x</Text>
                      <Button
                        variant="subtle"
                        color="blue"
                        size="xs"
                        radius="md"
                        style={{ fontWeight: 600, padding: '0 8px' }}
                        onClick={() => router.push(`/team/${m.away_team_id}`)}
                      >
                        {m.away_team}
                      </Button>
                      <Badge
                        color={status === 'FINISHED' ? 'green' : status === 'IN_PROGRESS' ? 'yellow' : 'gray'}
                        variant="light"
                      >
                        {status === 'FINISHED'
                          ? 'Finalizado'
                          : status === 'IN_PROGRESS'
                          ? 'Em andamento'
                          : 'Agendado'}
                      </Badge>
                    </Group>
                    <Menu shadow="md" width={160} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm" style={{ position: 'absolute', top: 8, right: 8 }}>
                          <IconDotsVertical size={18} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => handleEdit(m)}>Editar palpite</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                  <Text size="xs" c="dimmed" mt={2}>Data: {m.match_date ? new Date(m.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</Text>
                  <Group gap={8} mt={4}>
                    <Text size="sm">Previsão Predictz: <b>{m.predictz_home_score} - {m.predictz_away_score}</b></Text>
                    <Text size="sm">Seu palpite: <b>{m.user_predicted_home_score ?? "-"} - {m.user_predicted_away_score ?? "-"}</b></Text>
                    <Text size="sm">Placar real: <b>{m.actual_home_score ?? "-"} - {m.actual_away_score ?? "-"}</b></Text>
                  </Group>
                </Card>
              );
            })}
          </Stack>
          <Modal opened={modalOpened} onClose={closeModal} title="Editar Palpite" centered>
            <Stack gap={12}>
              <Group gap={8}>
                <NumberInput
                  label="Palpite Casa"
                  value={editValues.user_predicted_home_score}
                  onChange={value => setEditValues(v => ({ ...v, user_predicted_home_score: value }))}
                  min={0}
                  max={20}
                />
                <NumberInput
                  label="Palpite Fora"
                  value={editValues.user_predicted_away_score}
                  onChange={value => setEditValues(v => ({ ...v, user_predicted_away_score: value }))}
                  min={0}
                  max={20}
                />
              </Group>
              <Group gap={8}>
                <NumberInput
                  label="Placar Real Casa"
                  value={editValues.actual_home_score}
                  onChange={value => setEditValues(v => ({ ...v, actual_home_score: value }))}
                  min={0}
                  max={20}
                />
                <NumberInput
                  label="Placar Real Fora"
                  value={editValues.actual_away_score}
                  onChange={value => setEditValues(v => ({ ...v, actual_away_score: value }))}
                  min={0}
                  max={20}
                />
              </Group>
              <Group justify="end" mt={8}>
                <Button onClick={handleSave} color="blue">Salvar</Button>
              </Group>
            </Stack>
          </Modal>
          <Group justify="center" mt={24}>
            <Pagination
              value={page}
              onChange={setPage}
              total={Math.ceil(total / pageSize)}
              size="md"
              radius="md"
              withEdges
            />
          </Group>
        </>
      )}
    </Container>
  );
}
