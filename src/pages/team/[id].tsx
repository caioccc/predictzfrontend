/* eslint-disable  @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "@/api";
import { Card, Title, Group, Stack, Text, Loader, Center, Badge, Table, RingProgress, Container, Pagination } from "@mantine/core";
import { IconBallFootball, IconArrowRight, IconChartBar, IconTrophy, IconHandStop, IconHandRock, IconSoccerField, IconTargetArrow, IconArrowDown, IconArrowUp } from "@tabler/icons-react";

export default function TeamPage() {
  const router = useRouter();
  const { id } = router.query;
  const [team, setTeam] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/teams/${id}/`),
      api.get(`/teams/${id}/matches/?limit=${pageSize}&offset=${(page - 1) * pageSize}`),
    ]).then(([teamRes, matchesRes]) => {
      setTeam(teamRes.data);
      setMatches(matchesRes.data.results ?? []);
      setMatchesCount(matchesRes.data.count ?? 0);
      setLoading(false);
    });
  }, [id, page]);

  if (loading) {
    return <Center py={40}><Loader color="blue" size="lg" /></Center>;
  }
  if (!team) {
    return <Center py={40}><Text color="red">Time não encontrado.</Text></Center>;
  }

  // Índices do time
  const totalMatches = matches.length;
  const wins = matches.filter((m) => m.actual_home_score !== null && m.actual_away_score !== null && ((m.home_team_id === team.id && m.actual_home_score > m.actual_away_score) || (m.away_team_id === team.id && m.actual_away_score > m.actual_home_score))).length;
  const draws = matches.filter((m) => m.actual_home_score !== null && m.actual_away_score !== null && m.actual_home_score === m.actual_away_score).length;
  const losses = totalMatches - wins - draws;
  const goalsFor = matches.reduce((acc, m) => acc + (m.home_team_id === team.id ? m.actual_home_score ?? 0 : m.actual_away_score ?? 0), 0);
  const goalsAgainst = matches.reduce((acc, m) => acc + (m.home_team_id === team.id ? m.actual_away_score ?? 0 : m.actual_home_score ?? 0), 0);

  // Próximas partidas
  const upcoming = matches.filter((m) => m.status === "SCHEDULED" || m.status === "IN_PROGRESS");
  // Últimas partidas
  const history = matches.filter((m) => m.status === "FINISHED").slice(0, 10);

  return (
    <Container size="md" py={32}>
      <Stack gap={24}>
        <Title order={2} mb={8}><IconBallFootball style={{ marginRight: 8 }} /> {team.name}</Title>
        <Group gap={16} wrap="wrap">
          <Card shadow="md" radius="md" p={16} withBorder style={{ minWidth: 180, flex: 1 }}>
            <Group gap={8} align="center">
              <IconSoccerField color="blue" size={28} />
              <Text fw={700}>Partidas</Text>
            </Group>
            <Text size="xl" ta="center">{totalMatches}</Text>
          </Card>
          <Card shadow="md" radius="md" p={16} withBorder style={{ minWidth: 180, flex: 1 }}>
            <Group gap={8} align="center">
              <IconTrophy color="green" size={28} />
              <Text fw={700}>Vitórias</Text>
            </Group>
            <Text size="xl" ta="center" c="green">{wins}</Text>
          </Card>
          <Card shadow="md" radius="md" p={16} withBorder style={{ minWidth: 180, flex: 1 }}>
            <Group gap={8} align="center">
              <IconHandStop color="gray" size={28} />
              <Text fw={700}>Empates</Text>
            </Group>
            <Text size="xl" ta="center" c="gray">{draws}</Text>
          </Card>
          <Card shadow="md" radius="md" p={16} withBorder style={{ minWidth: 180, flex: 1 }}>
            <Group gap={8} align="center">
              <IconHandRock color="red" size={28} />
              <Text fw={700}>Derrotas</Text>
            </Group>
            <Text size="xl" ta="center" c="red">{losses}</Text>
          </Card>
          <Card shadow="md" radius="md" p={16} withBorder style={{ minWidth: 180, flex: 1 }}>
            <Group gap={8} align="center">
              <IconArrowUp color="blue" size={28} />
              <Text fw={700}>Gols Pró</Text>
            </Group>
            <Text size="xl" ta="center" c="blue">{goalsFor}</Text>
          </Card>
          <Card shadow="md" radius="md" p={16} withBorder style={{ minWidth: 180, flex: 1 }}>
            <Group gap={8} align="center">
              <IconArrowDown color="red" size={28} />
              <Text fw={700}>Gols Contra</Text>
            </Group>
            <Text size="xl" ta="center" c="red">{goalsAgainst}</Text>
          </Card>
          <Card shadow="md" radius="md" p={16} withBorder style={{ minWidth: 180, flex: 1 }}>
            <Group gap={8} align="center">
              <IconTargetArrow color="green" size={28} />
              <Text fw={700}>% Vitórias</Text>
            </Group>
            <RingProgress
              sections={[{ value: totalMatches ? (wins / totalMatches) * 100 : 0, color: 'green' }]}
              size={120}
              thickness={12}
              roundCaps
              label={<Text c="green" fw={700} ta="center" size="xl">{totalMatches ? ((wins / totalMatches) * 100).toFixed(1) : "0.0"}%</Text>}
            />
          </Card>
        </Group>
        <Card shadow="md" radius="md" p={20} withBorder style={{ width: '100%' }}>
          <Title order={4} mb={8}>Partidas do Time</Title>
          {matches.length === 0 ? <Text color="gray">Nenhuma partida encontrada.</Text> : (
            <>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Data</Table.Th>
                    <Table.Th>Adversário</Table.Th>
                    <Table.Th>Placar</Table.Th>
                    <Table.Th>Resultado</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {matches.map((m) => {
                    // Data formatada
                    const dateStr = m.match_date ? new Date(m.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                    // Adversário
                    const adversario = m.home_team_id === team.id ? m.away_team : m.home_team;
                    // Placar
                    const placar = m.home_team_id === team.id
                      ? `${m.actual_home_score ?? '-'} - ${m.actual_away_score ?? '-'}`
                      : `${m.actual_away_score ?? '-'} - ${m.actual_home_score ?? '-'}`;
                    // Resultado
                    let resultado = '';
                    if (m.actual_home_score != null && m.actual_away_score != null) {
                      if ((m.home_team_id === team.id && m.actual_home_score > m.actual_away_score) || (m.away_team_id === team.id && m.actual_away_score > m.actual_home_score)) {
                        resultado = 'Vitória';
                      } else if (m.actual_home_score === m.actual_away_score) {
                        resultado = 'Empate';
                      } else {
                        resultado = 'Derrota';
                      }
                    } else {
                      resultado = '-';
                    }
                    return (
                      <Table.Tr key={m.id}>
                        <Table.Td>{dateStr}</Table.Td>
                        <Table.Td>{adversario}</Table.Td>
                        <Table.Td>{placar}</Table.Td>
                        <Table.Td>{resultado}</Table.Td>
                        <Table.Td>{m.status}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
              <Group justify="center" mt={16}>
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={Math.ceil(matchesCount / pageSize)}
                  size="md"
                  radius="md"
                  withEdges
                />
              </Group>
            </>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
