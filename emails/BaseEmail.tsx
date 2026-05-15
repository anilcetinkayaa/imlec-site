import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

type BaseEmailProps = {
  preview: string;
  title: string;
  children: ReactNode;
};

export function BaseEmail({ preview, title, children }: BaseEmailProps) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={brand}>İmleç Yazılım</Text>
          <Heading style={heading}>{title}</Heading>
          <Section style={section}>{children}</Section>
          <Text style={footer}>
            Bu e-posta İmleç Yazılım hesabınızla ilgili işlem bildirimi için gönderildi.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const body = {
  margin: "0",
  backgroundColor: "#0f1013",
  color: "#f5f5f5",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

export const container = {
  width: "100%",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 24px",
};

export const brand = {
  color: "#67a5ff",
  fontSize: "12px",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
};

export const heading = {
  color: "#ffffff",
  fontSize: "28px",
  lineHeight: "1.2",
  fontWeight: "600",
};

export const section = {
  border: "1px solid #2f3540",
  backgroundColor: "#171a20",
  borderRadius: "14px",
  padding: "20px",
};

export const text = {
  color: "#b5bdc9",
  fontSize: "14px",
  lineHeight: "1.7",
};

export const mono = {
  color: "#ffffff",
  fontFamily:
    "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace",
  fontSize: "20px",
  letterSpacing: "0.12em",
};

export const footer = {
  color: "#7b8492",
  fontSize: "12px",
  lineHeight: "1.6",
  marginTop: "20px",
};
