/* eslint-disable  @typescript-eslint/no-explicit-any */
import { ActionIcon, Button, Card, Center, Collapse, Container, Group, Loader, Menu, Modal, NumberInput, Stack, Text, Title, Badge } from "@mantine/core";
import { useRouter } from "next/router";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconDotsVertical, IconReload, IconChevronDown } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
// import { useInView } from "react-intersection-observer";
import { api } from "../api";
import { notifications } from "@mantine/notifications";

export default function Home() {
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  // Infinite scroll removido
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editMatch, setEditMatch] = useState<any | null>(null);
  const [editValues, setEditValues] = useState({
    actual_home_score: null,
    actual_away_score: null,
    user_predicted_home_score: null,
    user_predicted_away_score: null,
  });

  const [openLeagues, setOpenLeagues] = useState<Record<string, boolean>>({});

  // Funções de navegação de datas
  const goToYesterday = () => setDate(dayjs(date).subtract(1, "day").toDate());
  const goToTomorrow = () => setDate(dayjs(date).add(1, "day").toDate());
  const goToToday = () => setDate(new Date());


  // Função para buscar jogos do backend
  const fetchMatches = useCallback(async (selectedDate: Date | null) => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const dateStr = dayjs(selectedDate).format("YYYY-MM-DD");
      const res = await api.get(`/matches/?date=${dateStr}`);
      setMatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMatches([]);
    }
    setLoading(false);
  }, []);

  // Recarrega ao mudar a data
  useEffect(() => {
    fetchMatches(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const reloadMatches = async () => {
    const selectedDate = date ?? new Date();
    const dateStr = dayjs(selectedDate).format("YYYY-MM-DD");
    setLoading(true);
    try {
      await api.post("/scrape/", { date: dateStr });
      notifications.show({
        title: "Sucesso",
        message: "Processamento iniciado",
        color: "green",
      });
    } catch (err) {
      // Tratar erro
      notifications.show({
        title: "Erro ao recarregar jogos",
        message: "Ocorreu um erro ao tentar recarregar os jogos.",
        color: "red",
      });
    }
    await fetchMatches(selectedDate);
    setLoading(false);
  };

  // Função para abrir modal de edição
  const handleEdit = (match: any) => {
    setEditMatch(match);
    setEditValues({
      actual_home_score: match.actual_home_score ?? "",
      actual_away_score: match.actual_away_score ?? "",
      user_predicted_home_score: match.user_predicted_home_score ?? "",
      user_predicted_away_score: match.user_predicted_away_score ?? "",
    });
    openModal();
  };

  // Função para salvar edição
  const handleSave = async () => {
    if (!editMatch) return;
    setLoading(true);
    try {
      // Atualiza placar real apenas se preenchido
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

      // Atualiza previsão do usuário apenas se preenchido
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
      fetchMatches(date);
    } catch (err) {
      // Tratar erro
    }
    setLoading(false);
  };

  return (
    <Container size="md" py={32}>
      <Group justify="space-between" mb={24}>
        <Title order={2}>Jogos do dia</Title>
        <Button leftSection={<IconReload size={18} />} onClick={reloadMatches} variant="light" color="blue" radius="md">
          Recarregar
        </Button>
      </Group>

      <Group mb={24} gap={8}>
        <Button leftSection={<IconChevronLeft size={18} />} onClick={goToYesterday} variant="default" radius="md">Ontem</Button>
        <Button onClick={goToToday} variant="outline" radius="md">Hoje</Button>
        <Button rightSection={<IconChevronRight size={18} />} onClick={goToTomorrow} variant="default" radius="md">Amanhã</Button>
        <DatePickerInput
          value={date}
          onChange={setDate}
          leftSection={<IconCalendar size={18} />}
          radius="md"
          placeholder="Selecionar data"
          size="sm"
          minDate={dayjs().subtract(365, "day").toDate()}
          maxDate={dayjs().add(3, "day").toDate()}
        />
      </Group>

      {/* Loader de carregamento */}
      {loading ? (
        <Center py={40}>
          <Loader color="blue" size="lg" />
        </Center>
      ) : (
        <div className="mt-8">
          {matches.length === 0 ? (
            <div className="text-center text-gray-500">Nenhum jogo encontrado para a data selecionada.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Agrupa partidas por liga */}
              {Object.entries(
                matches.reduce((acc, match) => {
                  const liga = match.league || "Outras";
                  if (!acc[liga]) acc[liga] = [];
                  acc[liga].push(match);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([liga, partidas]) => {
                const isOpen = openLeagues[liga] ?? true;
                return (
                  <div key={liga}>
                    <Card withBorder radius="md" mb={16} shadow="sm">
                      <Group justify="space-between" mb={8}>
                        <Text fw={700} size="lg">{liga}</Text>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="md"
                          onClick={() => setOpenLeagues(prev => ({ ...prev, [liga]: !isOpen }))}
                          style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                        >
                          <IconChevronDown size={22} />
                        </ActionIcon>
                      </Group>
                      <Collapse in={isOpen} transitionDuration={300}>
                        <Stack gap={12}>
                          {partidas.map((match) => {
                            // Se a partida for do dia e não estiver finalizada, exibe como Em andamento
                            const isToday = dayjs(match.match_date).isSame(dayjs(), 'day');
                            const status = match.status === 'FINISHED'
                              ? 'FINISHED'
                              : isToday
                              ? 'IN_PROGRESS'
                              : 'SCHEDULED';
                            return (
                              <Card key={match.id} withBorder radius="md" shadow="xs" className="relative">
                                <Group justify="space-between" align="flex-start">
                                  <Group gap={8} align="center">
                                    <Button
                                      variant="subtle"
                                      color="blue"
                                      size="xs"
                                      radius="md"
                                      style={{ fontWeight: 600, padding: '0 8px' }}
                                      onClick={() => router.push(`/team/${match.home_team_id}`)}
                                    >
                                      {match.home_team}
                                    </Button>
                                    <Text fw={600} size="md">x</Text>
                                    <Button
                                      variant="subtle"
                                      color="blue"
                                      size="xs"
                                      radius="md"
                                      style={{ fontWeight: 600, padding: '0 8px' }}
                                      onClick={() => router.push(`/team/${match.away_team_id}`)}
                                    >
                                      {match.away_team}
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
                                      <Menu.Item onClick={() => handleEdit(match)} icon={<IconCalendar size={16} />}>Editar</Menu.Item>
                                    </Menu.Dropdown>
                                  </Menu>
                                </Group>
                                <Text size="xs" c="dimmed" mt={2}>Data: {dayjs(match.match_date).format("DD/MM/YYYY")}</Text>
                                <Group gap={8} mt={4}>
                                  <Text size="sm">Previsão Predictz: <b>{match.predictz_home_score} - {match.predictz_away_score}</b></Text>
                                  <Text size="sm">Sua previsão: <b>{match.user_predicted_home_score ?? "-"} - {match.user_predicted_away_score ?? "-"}</b></Text>
                                  <Text size="sm">Placar real: <b>{match.actual_home_score ?? "-"} - {match.actual_away_score ?? "-"}</b></Text>
                                </Group>
                              </Card>
                            );
                          })}
                        </Stack>
                      </Collapse>
                    </Card>
                  </div>
                );
              })}
              {/* Infinite scroll removido */}
              <Modal
                opened={modalOpened}
                onClose={closeModal}
                title={editMatch ? `${editMatch.home_team} x ${editMatch.away_team}` : "Editar partida"}
                centered
              >
                {editMatch && (
                  <Stack mb={8}>
                    <Text size="sm" c="dimmed">
                      Data: {dayjs(editMatch.match_date).format("DD/MM/YYYY HH:mm")}
                    </Text>
                    <Text size="sm">
                      Previsão Predictz: <b>{editMatch.predictz_home_score} - {editMatch.predictz_away_score}</b>
                    </Text>
                  </Stack>
                )}
                <Stack>
                  <NumberInput
                    label="Placar real - Casa"
                    value={editValues.actual_home_score}
                    onChange={value => setEditValues(v => ({ ...v, actual_home_score: value }))}
                    min={0}
                    max={20}
                  />
                  <NumberInput
                    label="Placar real - Fora"
                    value={editValues.actual_away_score}
                    onChange={value => setEditValues(v => ({ ...v, actual_away_score: value }))}
                    min={0}
                    max={20}
                  />
                  <NumberInput
                    label="Sua previsão - Casa"
                    value={editValues.user_predicted_home_score}
                    onChange={value => setEditValues(v => ({ ...v, user_predicted_home_score: value }))}
                    min={0}
                    max={20}
                  />
                  <NumberInput
                    label="Sua previsão - Fora"
                    value={editValues.user_predicted_away_score}
                    onChange={value => setEditValues(v => ({ ...v, user_predicted_away_score: value }))}
                    min={0}
                    max={20}
                  />
                  <Group justify="end">
                    <Button onClick={handleSave} color="blue" radius="md">Salvar</Button>
                  </Group>
                </Stack>
              </Modal>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
