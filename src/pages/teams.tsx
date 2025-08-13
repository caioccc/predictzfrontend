import { useState, useEffect } from 'react';
import { api } from '../api';
import { Container, Title, Card, Text, Group, Select, TextInput, Loader, Center, Badge, RingProgress, Box } from '@mantine/core';
import InfiniteScroll from 'react-infinite-scroll-component';
import { IconSearch, IconMouse } from '@tabler/icons-react';
import { useRouter } from 'next/router';

interface Team {
  id: number;
  name: string;
  num_matches: number;
  wins: number;
  draws: number;
  losses: number;
  leagues: string[];
}

interface League {
  id: number;
  name: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTeams = async (reset = false) => {
    if (reset) {
      setPage(1);
      setTeams([]);
    }
    setLoading(true);
    try {
      let url = `/teams/?page=${reset ? 1 : page}`;
      if (selectedLeague) url += `&league_id=${selectedLeague}`;
      if (searchTerm) url += `&name=${searchTerm}`;

      const res = await api.get(url);

      setTeams(prev => reset ? res.data.results : [...prev, ...res.data.results]);
      setHasMore(res.data.next !== null);
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to fetch teams", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await api.get('/leagues/');
        setLeagues(res.data);
      } catch (error) {
        console.error("Failed to fetch leagues", error);
      }
    };
    fetchLeagues();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTeams(true);
    }, 500); // Debounce search term
    return () => clearTimeout(handler);
  }, [searchTerm, selectedLeague]);

  return (
    <Container size="md" py={32}>
      <Title order={2} mb={24}>Times</Title>
      <Group mb={24}>
        <TextInput
          placeholder="Buscar por nome..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filtrar por liga"
          data={leagues.map(l => ({ value: l.id.toString(), label: l.name }))}
          value={selectedLeague}
          onChange={setSelectedLeague}
          clearable
          style={{ minWidth: 200 }}
        />
      </Group>

      <InfiniteScroll
        dataLength={teams.length}
        next={fetchTeams}
        hasMore={hasMore}
        loader={<Center py={20}><Loader /></Center>}
        endMessage={
          <Center py={20}>
            <Text>Fim dos resultados.</Text>
          </Center>
        }
      >
        {teams.map(team => {
          const winPct = team.num_matches ? (team.wins / team.num_matches) * 100 : 0;
          return (
            <Card
              key={team.id}
              shadow="sm"
              p="lg"
              radius="md"
              withBorder
              mb="md"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 24, justifyContent: 'flex-start' }}
              onClick={() => router.push(`/team/${team.id}`)}
            >
              <Box className="flex flex-row gap-4"
                style={{
                  gap: '16px',
                }}
              >
                <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 90 }}>
                  <RingProgress
                    sections={[{ value: winPct, color: 'green' }]}
                    size={90}
                    thickness={10}
                    roundCaps
                    label={<Text c="green" fw={700} ta="center" size="md">{winPct.toFixed(1)}%</Text>}
                    style={{ minWidth: 90 }}
                  />
                </Box>
                <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Group justify="start" gap={8} mb={4} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    flex: 1
                  }}>
                    <Title order={4}>{team.name}</Title>
                    <Group gap={4}>
                      {team.leagues.map(league => <Badge key={league}>{league}</Badge>)}
                    </Group>
                  </Group>
                  <Group mt={4} gap={16} wrap="wrap" justify="start">
                    <Text>Partidas: <b>{team.num_matches}</b></Text>
                    <Text c="green">Vitórias: <b>{team.wins}</b></Text>
                    <Text c="orange">Empates: <b>{team.draws}</b></Text>
                    <Text c="red">Derrotas: <b>{team.losses}</b></Text>
                  </Group>
                </Box>

              </Box>

            </Card>
          );
        })}
      </InfiniteScroll>
    </Container>
  );
}
