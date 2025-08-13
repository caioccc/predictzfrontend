import {
  ActionIcon,
  AppShell,
  Group,
  NavLink,
  Title,
  Tooltip,
  useMantineColorScheme
} from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { IconBallFootball, IconChartBar, IconDownload, IconLayoutDashboard, IconMenu2, IconMoon, IconMusic, IconSun, IconUsersGroup, IconListCheck } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";


interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [navbarCollapsed, setNavbarCollapsed] = useState(false); // Começa aberto no desktop
  const pathname = usePathname();

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  useEffect(() => {
    setNavbarCollapsed(isMobile);
  }, [isMobile]);

  return (
    <>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: navbarCollapsed, desktop: navbarCollapsed } }}
        footer={{ height: 40 }}
      >
        {/* Header */}
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group justify="space-between">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => setNavbarCollapsed(c => !c)}
                display={{ base: 'inline-flex', sm: 'inline-flex' }}
                aria-label={'Abrir/fechar menu'}
              >
                <IconMenu2 size={28} />
              </ActionIcon>
              <Group>
                <Title order={2}>{'Predictz'}</Title>
              </Group>
            </Group>

            <Group>
              <Tooltip label={'Mudar tema'} position="bottom" withArrow>
                <ActionIcon
                  variant="subtle"
                  onClick={() => toggleColorScheme()}
                  size="lg"
                >
                  {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <AppShell.Section grow>
            <NavLink
              component={Link}
              href="/"
              label={'Início'}
              leftSection={<IconLayoutDashboard size={18} />}
              active={pathname === "/"}
            />
            <NavLink
              component={Link}
              href="/my-predictions"
              label={'Meus Palpites'}
              leftSection={<IconListCheck size={18} />}
              active={pathname === "/my-predictions"}
            />
            <NavLink
              component={Link}
              href="/stats"
              label={'Estatísticas'}
              leftSection={<IconChartBar size={18} />}
              active={pathname === "/stats" || (typeof pathname === 'string' && pathname.startsWith("/stats/"))}
            />
            <NavLink
              component={Link}
              href="/teams"
              label={'Times'}
              leftSection={<IconUsersGroup size={18} />}
              active={pathname === "/teams"}
            />
            <NavLink
              component={Link}
              href="/data"
              label={'Dados'}
              leftSection={<IconDownload size={18} />}
              active={pathname === "/data"}
            />
          </AppShell.Section>
        </AppShell.Navbar>
        <AppShell.Main style={isMobile ? { paddingLeft: 0, paddingRight: 0, paddingTop: 70, paddingBottom: 60 } : { marginTop: '16px', marginBottom: '16px' }}>
          {children}
        </AppShell.Main>
      </AppShell>
    </>
  );
}
