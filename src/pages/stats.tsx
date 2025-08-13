/* eslint-disable  @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, Title, Group, Progress, Table, Container, Loader, Center, Pagination, RingProgress, Text, Stack, Badge, Select, Box } from "@mantine/core";
import { IconCheck, IconX, IconChartBar, IconTrophy, IconArrowUpRight, IconArrowDownRight, IconBallFootball } from '@tabler/icons-react';
import { DatePicker, DatePickerInput } from '@mantine/dates';

export default function StatsPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [advanced, setAdvanced] = useState<any | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [resultsCount, setResultsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [res, adv] = await Promise.all([
          api.get("/stats/"),
          api.get("/stats/advanced/"),
        ]);
        setStats(res.data);
        setAdvanced(adv.data);
      } catch {
        setStats(null);
        setAdvanced(null);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await api.get('/leagues/');
        setLeagues(res.data);
      } catch {
        setLeagues([]);
      }
    };
    fetchLeagues();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        let url = `/stats/results/?limit=${pageSize}&offset=${offset}`;
        if (selectedLeague) url += `&league_id=${selectedLeague}`;
        if (startDate) url += `&start_date=${startDate.toISOString().slice(0, 10)}`;
        if (endDate) url += `&end_date=${endDate.toISOString().slice(0, 10)}`;
        const res = await api.get(url);
        setResults(res.data.results);
        setResultsCount(res.data.count);
      } catch {
        setResults([]);
        setResultsCount(0);
      }
      setLoading(false);
    };
    fetchResults();
  }, [page, selectedLeague, startDate, endDate]);

  // Cálculo de estatísticas extras
  const total = stats?.total ?? 0;
  const userTotal = stats?.user_total ?? 0;
  const userOutcomePct = userTotal ? ((stats.user_outcome_hits / userTotal) * 100).toFixed(2) : "0.00";
  const userScorePct = userTotal ? ((stats.user_score_hits / userTotal) * 100).toFixed(2) : "0.00";
  const predictzOutcomePct = total ? ((stats.predictz_outcome_hits / total) * 100).toFixed(2) : "0.00";
  const predictzScorePct = total ? ((stats.predictz_score_hits / total) * 100).toFixed(2) : "0.00";

  // Médias de gols previstos/reais
  const mediaGolsPrevistos = results.length
    ? (
      results.reduce((acc, r) => acc + (r.user_score[0] ?? 0) + (r.user_score[1] ?? 0), 0) / (results.length * 2)
    ).toFixed(2)
    : "0.00";
  const mediaGolsPredictz = results.length
    ? (
      results.reduce((acc, r) => acc + (r.predictz_score[0] ?? 0) + (r.predictz_score[1] ?? 0), 0) / (results.length * 2)
    ).toFixed(2)
    : "0.00";
  const mediaGolsReais = results.length
    ? (
      results.reduce((acc, r) => acc + (r.actual_score[0] ?? 0) + (r.actual_score[1] ?? 0), 0) / (results.length * 2)
    ).toFixed(2)
    : "0.00";

  // Histórico dos últimos resultados
  const historico = results.slice(0, 10);

  return (
    <Container size="md" py={32}>
      <Title order={2} mb={24}>
        <IconChartBar style={{ marginRight: 8 }} /> Minhas Estatísticas
      </Title>
      {loading ? (
        <Center py={40}>
          <Loader color="blue" size="lg" />
        </Center>
      ) : stats && advanced ? (
        <>
          <Stack mb={24} gap={20}>
            <Card shadow="md" radius="md" p={20} withBorder style={{ width: '100%' }}>
              <Group justify="space-between" mb={8}>
                <Title order={4} mb={0}><IconTrophy style={{ marginRight: 6 }} /> Acertos</Title>
                <Badge color="blue" size="lg">Total: {userTotal}</Badge>
              </Group>
              <Group gap={24} justify="center">
                <Stack gap={2} align="center">
                  <RingProgress
                    sections={[{ value: Number(userOutcomePct), color: 'blue' }]}
                    size={120}
                    thickness={12}
                    roundCaps
                    label={
                      <Text c="blue" fw={700} ta="center" size="xl">
                        {userOutcomePct}%
                      </Text>
                    }
                  />
                  <Text size="sm" ta="center">Acertos de resultado do usuário</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <RingProgress
                    sections={[{ value: Number(userScorePct), color: 'green' }]}
                    size={120}
                    thickness={12}
                    roundCaps
                    label={
                      <Text c="green" fw={700} ta="center" size="xl">
                        {userScorePct}%
                      </Text>
                    }
                  />
                  <Text size="sm" ta="center">Acertos de placar do usuário</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <RingProgress
                    sections={[{ value: Number(predictzOutcomePct), color: 'orange' }]}
                    size={120}
                    thickness={12}
                    roundCaps
                    label={
                      <Text c="orange" fw={700} ta="center" size="xl">
                        {predictzOutcomePct}%
                      </Text>
                    }
                  />
                  <Text size="sm" ta="center">Acertos de resultado Predictz</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <RingProgress
                    sections={[{ value: Number(predictzScorePct), color: 'red' }]}
                    size={120}
                    thickness={12}
                    roundCaps
                    label={
                      <Text c="red" fw={700} ta="center" size="xl">
                        {predictzScorePct}%
                      </Text>
                    }
                  />
                  <Text size="sm" ta="center">Acertos de placar Predictz</Text>
                </Stack>
              </Group>
            </Card>
            <Card shadow="md" radius="md" p={20} withBorder style={{ width: '100%' }}>
              <Title order={4} mb={8}><IconBallFootball style={{ marginRight: 6 }} /> Médias de Gols</Title>
              <Group gap={24} justify="center">
                <Stack gap={4} align="center">
                  <Text size="lg" fw={700} color="blue">{mediaGolsPrevistos}</Text>
                  <Text size="sm">Gols previstos (Usuário)</Text>
                </Stack>
                <Stack gap={4} align="center">
                  <Text size="lg" fw={700} color="orange">{mediaGolsPredictz}</Text>
                  <Text size="sm">Gols previstos (Predictz)</Text>
                </Stack>
                <Stack gap={4} align="center">
                  <Text size="lg" fw={700} color="green">{mediaGolsReais}</Text>
                  <Text size="sm">Gols reais</Text>
                </Stack>
              </Group>
            </Card>
          </Stack>
          <Card shadow="md" mb={24}>
            <Title order={4} mb={8}><IconArrowUpRight style={{ marginRight: 6 }} /> Comparação Usuário x Predictz</Title>
            <Group gap={32}>
              <Stack gap={4} align="center">
                <Text size="md">Acertos Usuário</Text>
                <Text size="xl" fw={700} color="blue">{advanced.user_vs_predictz?.user_hits ?? 0} / {advanced.user_vs_predictz?.user_total ?? 0}</Text>
              </Stack>
              <Stack gap={4} align="center">
                <Text size="md">Acertos Predictz</Text>
                <Text size="xl" fw={700} color="orange">{advanced.user_vs_predictz?.predictz_hits ?? 0} / {advanced.user_vs_predictz?.predictz_total ?? 0}</Text>
              </Stack>
              <Stack gap={4} align="center">
                <Text size="md">Quem acerta mais</Text>
                <Badge color={advanced.user_vs_predictz?.winner === 'user' ? 'blue' : advanced.user_vs_predictz?.winner === 'predictz' ? 'orange' : 'gray'} size="lg">
                  {advanced.user_vs_predictz?.winner === 'user' ? 'Usuário' : advanced.user_vs_predictz?.winner === 'predictz' ? 'Predictz' : 'Empate'}
                </Badge>
              </Stack>
              <Stack gap={4} align="center">
                <Text size="md">Dif. média placar (Usuário)</Text>
                <Text size="xl" fw={700} color="blue">{advanced.avg_score_diff_user ?? 0}</Text>
              </Stack>
              <Stack gap={4} align="center">
                <Text size="md">Dif. média placar (Predictz)</Text>
                <Text size="xl" fw={700} color="orange">{advanced.avg_score_diff_predictz ?? 0}</Text>
              </Stack>
            </Group>
          </Card>
          <Card shadow="md" mb={24}>
            <Title order={4} mb={8}><IconArrowDownRight style={{ marginRight: 6 }} /> Tendências (últimos 10 jogos)</Title>
            <Group gap={32}>
              <Stack gap={4} align="center">
                <Text size="md">Acertos Usuário</Text>
                <Text size="xl" fw={700} color="blue">{advanced.trend?.user_hits ?? 0} / {advanced.trend?.user_total ?? 0}</Text>
              </Stack>
              <Stack gap={4} align="center">
                <Text size="md">Acertos Predictz</Text>
                <Text size="xl" fw={700} color="orange">{advanced.trend?.predictz_hits ?? 0} / {advanced.trend?.predictz_total ?? 0}</Text>
              </Stack>
            </Group>
          </Card>
          <Card shadow="md" mb={24} style={{ padding: 24 }}>
            <Title order={4} mb={8}><IconCheck style={{ marginRight: 6 }} /> Sequência de Acertos/Erros (Streaks)</Title>
            <Text size="sm" mb={12} ta="center">
              Este card mostra as séries de acertos e erros consecutivos. Por exemplo, "Acerto x3" significa 3 acertos seguidos, "Erro x2" são 2 erros seguidos. Assim, você pode visualizar se está em uma boa fase ou sequência ruim.
            </Text>
            <Group gap={32}>
              <Stack gap={4} align="center">
                <Text size="md" fw={700} color="blue">Usuário</Text>
                <Box style={{ maxHeight: 200, display: 'flex', overflow: "auto" }}>
                  <Group gap={4}>
                    {(advanced.user_streak ?? []).map((s: any, i: number) => (
                      <Badge key={i} color={s.type === 'hit' ? 'blue' : 'red'} leftSection={s.type === 'hit' ? <IconCheck size={14} /> : <IconX size={14} />}>
                        {s.type === 'hit' ? 'Acerto' : 'Erro'} x{s.length}
                      </Badge>
                    ))}
                  </Group>
                </Box>
              </Stack>
              <Stack gap={4} align="center">
                <Text size="md" fw={700} color="orange">Predictz</Text>
                <Box style={{ maxHeight: 200, display: 'flex', overflow: "auto" }}>
                  <Group gap={4}>
                    {(advanced.predictz_streak ?? []).map((s: any, i: number) => (
                      <Badge key={i} color={s.type === 'hit' ? 'orange' : 'red'} leftSection={s.type === 'hit' ? <IconCheck size={14} /> : <IconX size={14} />}>{s.type === 'hit' ? 'Acerto' : 'Erro'} x{s.length}</Badge>
                    ))}
                  </Group>
                </Box>
              </Stack>
            </Group>
          </Card>
          <Card shadow="sm" mb={24}>
            <Title order={4} mb={8}>Partidas com Maior Discrepância</Title>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Partida</Table.Th>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Diferença Usuário</Table.Th>
                  <Table.Th>Diferença Predictz</Table.Th>
                  <Table.Th>Maior Diferença</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(advanced.max_discrepancy_matches ?? []).map((m: any) => (
                  <Table.Tr key={m.id}>
                    <Table.Td>{m.home_team} x {m.away_team}</Table.Td>
                    <Table.Td>{m.date ? new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</Table.Td>
                    <Table.Td>{m.predictz_diff ?? '-'}</Table.Td>
                    <Table.Td>{m.max_diff ?? '-'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
          <Card shadow="sm" mb={24}>
            <Title order={4} mb={8}>Histórico (últimos 10 resultados)</Title>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Partida</Table.Th>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Placar Real</Table.Th>
                  <Table.Th>Previsão Usuário</Table.Th>
                  <Table.Th>Previsão Predictz</Table.Th>
                  <Table.Th>Acerto Usuário</Table.Th>
                  <Table.Th>Acerto Predictz</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {historico.map((r: any) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{r.home_team} x {r.away_team}</Table.Td>
                    <Table.Td>{r.date ? new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</Table.Td>
                    <Table.Td>{r.user_score[0] ?? "-"} - {r.user_score[1] ?? "-"}</Table.Td>
                    <Table.Td>{r.predictz_score[0]} - {r.predictz_score[1]}</Table.Td>
                    <Table.Td>{r.user_outcome_correct ? "✔️" : "❌"} {r.user_score_correct ? "(Placar)" : ""}</Table.Td>
                    <Table.Td>{r.predictz_outcome_correct ? "✔️" : "❌"} {r.predictz_score_correct ? "(Placar)" : ""}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
          <Card shadow="sm" mb={24}>
            <Title order={4} mb={8}>Resultados Detalhados</Title>
            <Group mb={16} gap={16} justify="start">
              <Select
                label="Liga"
                placeholder="Selecione a liga"
                data={leagues.map(l => ({ value: l.id.toString(), label: l.name }))}
                value={selectedLeague}
                onChange={setSelectedLeague}
                clearable
                style={{ minWidth: 200 }}
              />
              <DatePickerInput
                label="Data inicial"
                value={startDate}
                onChange={setStartDate}
                placeholder="Início"
                style={{ minWidth: 150 }}
              />
              <DatePickerInput
                label="Data final"
                value={endDate}
                onChange={setEndDate}
                placeholder="Fim"
                style={{ minWidth: 150 }}
              />
            </Group>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Partida</Table.Th>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Liga</Table.Th>
                  <Table.Th>Placar Real</Table.Th>
                  <Table.Th>Previsão Usuário</Table.Th>
                  <Table.Th>Previsão Predictz</Table.Th>
                  <Table.Th>Acerto Usuário</Table.Th>
                  <Table.Th>Acerto Predictz</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {results.map((r: any) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{r.home_team} x {r.away_team}</Table.Td>
                    <Table.Td>{r.date ? new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</Table.Td>
                    <Table.Td>{r.league}</Table.Td>
                    <Table.Td>{r.actual_score[0]} - {r.actual_score[1]}</Table.Td>
                    <Table.Td>{r.user_score[0] ?? "-"} - {r.user_score[1] ?? "-"}</Table.Td>
                    <Table.Td>{r.predictz_score[0]} - {r.predictz_score[1]}</Table.Td>
                    <Table.Td>{r.user_outcome_correct ? "✔️" : "❌"} {r.user_score_correct ? "(Placar)" : ""}</Table.Td>
                    <Table.Td>{r.predictz_outcome_correct ? "✔️" : "❌"} {r.predictz_score_correct ? "(Placar)" : ""}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="center" mt={16}>
              <Pagination
                value={page}
                onChange={setPage}
                total={Math.ceil(resultsCount / pageSize)}
                size="md"
                radius="md"
                withEdges
              />
            </Group>
          </Card>
        </>
      ) : (
        <div className="text-center text-gray-500">Não foi possível carregar as estatísticas.</div>
      )}
    </Container>
  );
}
