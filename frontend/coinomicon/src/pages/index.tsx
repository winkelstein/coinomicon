import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import {
  Button,
  Col,
  Container,
  Grid,
  Link,
  Navbar,
  Text,
  Image,
  Row,
  Spacer,
} from '@nextui-org/react'
import InfoCard from '../components/InfoCard'

const inter = Inter({ subsets: ['latin'] })

// TODO: add links
const routes = {
  app: 'exchange',
  docs: 'docs',
  contact: 'contacts',
}

export default function Home() {
  return (
    <Container>
      <Navbar isCompact variant="static">
        <Navbar.Brand>
          <Text b color="inherit">
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
          {/* TODO: add functionality */}
          <Button auto color="primary" bordered>
            Connect wallet
          </Button>
        </Navbar.Content>
      </Navbar>

      <Container
        css={{
          height: '100%',
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
                }}
              >
                Decentralized Exchange
              </Text>
              <Text
                weight={'bold'}
                size={70}
                css={{
                  textAlign: 'center',
                }}
              >
                For everyone
              </Text>
              <Row justify="center">
                <Link href={routes.app}>
                  <Button shadow color="gradient" size="md">
                    Get started
                  </Button>
                </Link>
              </Row>
            </Col>
          </Grid>
        </Grid.Container>

        <Spacer y={12} />

        <Grid.Container gap={8} justify="center">
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
                imageUrl="vik.jpg"
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
                title="Contribute to the project or report an issue to make it better."
                imageUrl="tail.jpg"
                buttonText="contact us"
                buttonLink={routes.contact}
              />
            </Grid>
          </Row>
        </Grid.Container>
      </Container>
    </Container>
  )
}
