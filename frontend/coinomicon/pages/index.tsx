import {
  Button,
  Col,
  Container,
  Grid,
  Link,
  Navbar,
  Text,
  Row,
  Spacer,
} from '@nextui-org/react'
import InfoCard from '@/components/InfoCard'
import TelegramIcon from '@/components/icons/TelegramIcon'
import GithubIcon from '@/components/icons/GithubIcon'

const routes = {
  app: '/exchange',
  docs: '/docs',
  contact: '/contacts',
}

export default function Home() {
  return (
    <Container>
      <Navbar isBordered isCompact variant="static">
        <Navbar.Brand as={Link} href="/">
          <Text h4 b color="white">
            Coinomicon
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
        </Navbar.Content>
      </Navbar>

      <Container
        css={{
          backgroundImage: 'url(headlights.jpg)',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'auto',
        }}
      >
        <Grid.Container justify="center">
          <Grid xs={12} sm={6} alignItems="center">
            <Col css={{ width: '100%', marginTop: '50vh' }}>
              <Text
                weight="bold"
                size={70}
                css={{
                  textAlign: 'center',
                  textGradient: '45deg, $blue600 -20%, $pink600 50%',
                }}
              >
                Decentralized Exchange
              </Text>
              <Text
                weight={'bold'}
                size={70}
                css={{
                  textAlign: 'center',
                  textGradient: '45deg, $purple600 -20%, $pink600 100%',
                }}
              >
                For everyone
              </Text>
              <Row justify="center">
                <Button
                  as={Link}
                  href={routes.app}
                  shadow
                  color="gradient"
                  size="md"
                  css={{ marginTop: '10px' }}
                >
                  Get started
                </Button>
              </Row>
            </Col>
          </Grid>
        </Grid.Container>

        <Spacer y={12} />

        <Grid.Container gap={8} justify="center" css={{ paddingBottom: '50%' }}>
          <Row gap={5}>
            <Grid>
              <Text h1>Jump in</Text>
              <Text h3>
                Trade crypto-tokens directly on the Ethereum blockchain without
                third-party control.
              </Text>
            </Grid>
          </Row>
          <Spacer y={4} />
          <Row gap={5}>
            <Grid xs={6}>
              <InfoCard
                label="About"
                title="Build DeFi apps with Coinomicon on Ethereum. Start with quick quide, simple documentation and GitHub source code."
                imageUrl="/vik.jpg"
                buttonText="go to docs"
                buttonLink={routes.docs}
              />
            </Grid>
            <Grid>
              <Text h1>Coinomicon</Text>
              <Text h3>Decentralized Exchange on Order Book</Text>
              <Text h6>powered by Ethereum</Text>
            </Grid>
          </Row>
          <Row gap={5}>
            <Grid>
              <Text h1>Development</Text>
              <Text h3>
                Become a developer and contribute to the Coinomicon DEX.
              </Text>
            </Grid>
            <Grid xs={6}>
              <InfoCard
                label="Development"
                title="Contribute to the project or report an issue to make it better. Also, you can ask us anything about Coinomicon project and suggest new features."
                imageUrl="/tail.jpg"
                buttonText="contact us"
                buttonLink={routes.contact}
              />
            </Grid>
          </Row>
        </Grid.Container>
      </Container>

      <Container
        css={{ position: 'absolute', bottom: 0, width: '100%', height: '30px' }}
      >
        <Text b>Coinomicon.</Text>
        <Text>Made by winkelstein. MIT License.</Text>
      </Container>
    </Container>
  )
}
