<?php

namespace App\Tests\Integration;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class AbstractIntegrationTestCase extends WebTestCase
{
    protected KernelBrowser $client;
    protected EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->client->disableReboot();
        $this->em     = static::getContainer()->get(EntityManagerInterface::class);
    }

    // -------------------------------------------------------------------------
    // Helpers HTTP
    // -------------------------------------------------------------------------

    protected function post(string $url, array $data, array $headers = []): void
    {
        $this->client->request(
            'POST',
            $url,
            [],
            [],
            array_merge(['CONTENT_TYPE' => 'application/json'], $this->toServerHeaders($headers)),
            json_encode($data),
        );
    }

    protected function get(string $url, array $headers = []): void
    {
        $this->client->request(
            'GET',
            $url,
            [],
            [],
            array_merge(['CONTENT_TYPE' => 'application/json'], $this->toServerHeaders($headers)),
        );
    }

    protected function patch(string $url, array $data, array $headers = []): void
    {
        $this->client->request(
            'PATCH',
            $url,
            [],
            [],
            array_merge(['CONTENT_TYPE' => 'application/json'], $this->toServerHeaders($headers)),
            json_encode($data),
        );
    }

    protected function delete(string $url, array $data = [], array $headers = []): void
    {
        $this->client->request(
            'DELETE',
            $url,
            [],
            [],
            array_merge(['CONTENT_TYPE' => 'application/json'], $this->toServerHeaders($headers)),
            json_encode($data),
        );
    }

    protected function statusCode(): int
    {
        $response = $this->client->getResponse();
        $statusCode = $response->getStatusCode();

        if ($statusCode >= 500) {
            $request = $this->client->getRequest();

            self::fail(sprintf(
                "Unexpected HTTP %d for %s %s:\n%s",
                $statusCode,
                $request?->getMethod() ?? 'UNKNOWN',
                $request?->getRequestUri() ?? 'UNKNOWN',
                $response->getContent(),
            ));
        }

        return $statusCode;
    }

    protected function json(): array
    {
        return json_decode($this->client->getResponse()->getContent(), true) ?? [];
    }

    // -------------------------------------------------------------------------
    // Auth helpers
    // -------------------------------------------------------------------------

    protected function loginAs(string $email, string $password): array
    {
        $this->post('/api/auth/login', ['email' => $email, 'password' => $password]);
        return $this->json();
    }

    protected function bearerHeader(string $token): array
    {
        return ['Authorization' => 'Bearer ' . $token];
    }

    // -------------------------------------------------------------------------
    // Base de données
    // -------------------------------------------------------------------------

    /**
     * Vide les tables en désactivant temporairement les FK MySQL.
     * À appeler dans setUp() des sous-classes qui ont besoin d'un état propre.
     */
    protected function truncateTables(array $tables): void
    {
        $conn = $this->em->getConnection();
        $conn->executeStatement('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($tables as $table) {
            $conn->executeStatement("TRUNCATE TABLE `{$table}`");
        }
        $conn->executeStatement('SET FOREIGN_KEY_CHECKS = 1');
        $this->em->clear();
    }

    // -------------------------------------------------------------------------
    // Privé
    // -------------------------------------------------------------------------

    private function toServerHeaders(array $headers): array
    {
        $server = [];
        foreach ($headers as $key => $value) {
            $server['HTTP_' . strtoupper(str_replace('-', '_', $key))] = $value;
        }
        return $server;
    }
}
