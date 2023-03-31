import {
  Container,
  Text,
  Navbar,
  Link,
  Card,
  Grid,
  Row,
} from '@nextui-org/react'
import React from 'react'
import TelegramIcon from '@/components/icons/TelegramIcon'
import GithubIcon from '@/components/icons/GithubIcon'
import InfoCard from '@/components/InfoCard'

const routes = {
  app: '/exchange',
  docs: '/docs',
  contact: '/contacts',
}

export default function Contacts() {
  return (
    <Container>
      <Navbar isBordered isCompact variant="static">
        <Navbar.Brand as={Link} href="/">
          <Text h4 b color="white">
            Coinomicon Contacts
          </Text>
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
            <GithubIcon />
          </Navbar.Link>
          <Navbar.Link
            href="https://t.me/treug0lnik"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramIcon />
          </Navbar.Link>
        </Navbar.Content>
      </Navbar>

      <Container>
        <Grid.Container justify="center" css={{ marginTop: '10vh' }}>
          <Row justify="center">
            <Grid xs={4} css={{ marginRight: '20px' }}>
              <InfoCard
                label="Documentation"
                title="Learn how Coinomicon works."
                imageUrl="/manchester.jpg"
                buttonText="go to docs"
                buttonLink={routes.docs}
              />
            </Grid>
          </Row>
          <Row justify="center" css={{ marginTop: '10vh' }}>
            <Text h1>We are on social media</Text>
          </Row>
          <Row justify="center">
            <Grid css={{ marginRight: '1vw' }}>
              <Card
                as={Link}
                href="https://github.com/treug0lnik041/"
                target="_blank"
              >
                <Card.Body>
                  <Row>
                    <GithubIcon />
                    <Text h3 css={{ marginLeft: 10 }}>
                      Github
                    </Text>
                  </Row>
                </Card.Body>
              </Card>
            </Grid>
            <Grid>
              <Card as={Link} href="https://t.me/treug0lnik" target="_blank">
                <Card.Body>
                  <Row>
                    <TelegramIcon />
                    <Text h3 css={{ marginLeft: 10 }}>
                      Telegram
                    </Text>
                  </Row>
                </Card.Body>
              </Card>
            </Grid>
          </Row>
        </Grid.Container>
      </Container>
    </Container>
  )
}
