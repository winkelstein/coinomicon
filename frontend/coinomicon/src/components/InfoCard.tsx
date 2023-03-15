import { Card, Text, Row, Col, Button, Link } from '@nextui-org/react'

type Props = {
  title: string
  label: string
  imageUrl: string
  buttonText: string
  buttonLink: string
}

export default function InfoCard(props: Props) {
  const { title, label, imageUrl, buttonText, buttonLink } = props
  return (
    <Card>
      <Card.Header css={{ position: 'absolute', top: 5 }}>
        <Col>
          <Text size={12} weight="bold" transform="uppercase" color="#ffffffAA">
            {label}
          </Text>
          <Text h3 color="white">
            {title}
          </Text>
        </Col>
      </Card.Header>
      <Card.Image src={imageUrl} />
      <Card.Footer css={{ position: 'absolute', bottom: 0 }}>
        <Row>
          <Col>
            <Row justify="flex-end">
              <Link href={buttonLink}>
                <Button flat auto rounded shadow color="primary">
                  <Text
                    css={{ color: 'inherit' }}
                    size={12}
                    weight="bold"
                    transform="uppercase"
                  >
                    {buttonText}
                  </Text>
                </Button>
              </Link>
            </Row>
          </Col>
        </Row>
      </Card.Footer>
    </Card>
  )
}
