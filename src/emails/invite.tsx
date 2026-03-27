import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface InviteEmailProps {
  inviteUrl: string;
  projectName: string;
  invitedBy: string;
  role: string;
}

export function InviteEmail({
  inviteUrl,
  projectName,
  invitedBy,
  role,
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join {projectName}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-md rounded-lg bg-white p-8 shadow">
            <Section>
              <Text className="text-xl font-bold text-gray-900">
                Project Invitation
              </Text>
              <Text className="text-gray-600">
                <strong>{invitedBy}</strong> has invited you to join{" "}
                <strong>{projectName}</strong> on Brian as a{" "}
                <strong>{role}</strong>.
              </Text>
              <Text className="text-gray-600">
                Click the button below to accept the invitation and create your
                account.
              </Text>
              <Button
                href={inviteUrl}
                className="mt-4 inline-block rounded bg-blue-600 px-6 py-3 text-white no-underline"
              >
                Accept Invitation
              </Button>
              <Hr className="my-6 border-gray-200" />
              <Text className="text-sm text-gray-400">
                If you didn&apos;t expect this invitation, you can safely ignore
                this email. The link will expire in 7 days.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
