import { useState } from 'react'
import {
  Container,
  Grid,
  Navbar,
  Row,
  Text,
  Image,
  Input,
  Link,
} from '@nextui-org/react'
import { SearchIcon } from '@/components/icons/SearchIcon'

const routes = {
  app: '/exchange',
  docs: '/docs',
  contact: '/contacts',
}

export default function Docs() {
  return (
    <Container>
      <Navbar isBordered isCompact variant="static">
        <Navbar.Brand>
          <Link href="/">
            <Text h4 b color="white">
              Coinomicon Docs
            </Text>
          </Link>
        </Navbar.Brand>
        <Navbar.Content>
          <Navbar.Link href={routes.app}>Launch App</Navbar.Link>
          <Navbar.Link href={routes.docs}>Docs</Navbar.Link>
          <Navbar.Link href={routes.contact}>Contact Us</Navbar.Link>
        </Navbar.Content>
        <Navbar.Content>
          <Navbar.Link
            href="https://github.com/treug0lnik041/coinomicon"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src="icons/github_24.png" alt="gh_link"></Image>
          </Navbar.Link>
          <Navbar.Link
            href="https://t.me/treug0lnik"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src="icons/telegram_24.png" alt="tg_link"></Image>
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
