import { Container, Navbar, Text, Input, Link } from '@nextui-org/react'
import SearchIcon from '@/components/icons/SearchIcon'
import TelegramIcon from '@/components/icons/TelegramIcon'
import GithubIcon from '@/components/icons/GithubIcon'

const routes = {
  app: '/exchange',
  docs: '/docs',
  contact: '/contacts',
}

export default function Docs() {
  return (
    <Container>
      <Navbar isBordered isCompact variant="static">
        <Navbar.Brand as={Link} href="/">
          <Text h4 b color="white">
            Coinomicon Docs
          </Text>
        </Navbar.Brand>
        <Navbar.Content>
          <Navbar.Link href={routes.app}>Launch App</Navbar.Link>
          <Navbar.Link href={routes.docs}>Docs</Navbar.Link>
          <Navbar.Link href={routes.contact}>Contact Us</Navbar.Link>
        </Navbar.Content>
        <Navbar.Content>
          <Navbar.Link
            href="https://github.com/winkelstein/coinomicon"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon />
          </Navbar.Link>
          <Navbar.Link
            href="https://t.me/winkelstein"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramIcon />
          </Navbar.Link>
          <Navbar.Item
            css={{
              '@xsMax': {
                w: '100%',
                jc: 'center',
              },
            }}
          >
            <Input
              clearable
              contentLeft={<SearchIcon size={16} />}
              contentLeftStyling={false}
              css={{
                w: '100%',
                '@xsMax': {
                  mw: '300px',
                },
                '& .nextui-input-content--left': {
                  h: '100%',
                  ml: '$4',
                  dflex: 'center',
                },
              }}
              placeholder="Search..."
            />
          </Navbar.Item>
        </Navbar.Content>
      </Navbar>

      {/* TODO: implement docs page */}
      <Container>
        <Text h1>Coming soon</Text>
      </Container>
    </Container>
  )
}
