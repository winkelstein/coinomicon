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
} from '@nextui-org/react'
import InfoCard from '../components/InfoCard'

const inter = Inter({ subsets: ['latin'] })

// TODO: add links
const routes = {
  app: '#',
  docs: '#',
  contact: '#',
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
          {/* TODO: add functionality */}
          <Button auto color="primary" bordered>
            Connect wallet
          </Button>
        </Navbar.Content>
      </Navbar>

      <Container
        css={{
          height: '150vh',
          backgroundImage: 'url(sunset.jpg)',
          backgroundPosition: 'center',
        }}
      >
        <Grid.Container justify="center" css={{ height: '1000px' }}>
          <Grid xs={12} sm={6} alignItems="center">
            <Col css={{ width: '100%' }}>
              <Text weight={'bold'} size={70} css={{ textAlign: 'center' }}>
                Decentralized Exchange
              </Text>
              <Text weight={'bold'} size={70} css={{ textAlign: 'center' }}>
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

        <Grid.Container gap={2}>
          <Grid xs={12} sm={4}>
            <InfoCard
              label="What are we"
              title="Decentralized Exchange on Order Book powered by Ethereum"
              imageUrl="atlantic_ridge.jpg"
              footerText="Learn how it works"
              buttonText="go to docs"
              buttonLink={routes.docs}
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <InfoCard
              label="Development"
              title="Contribute to the project or report an issues"
              imageUrl="building.jpg"
              footerText="Contact developers"
              buttonText="contact us"
              buttonLink={routes.contact}
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <InfoCard
              label="Get started"
              title="Trade tokens with confidence"
              imageUrl="tail.jpg"
              footerText="Let's start"
              buttonText="launch app"
              buttonLink={routes.app}
            />
          </Grid>
        </Grid.Container>
      </Container>
    </Container>
  )
}
