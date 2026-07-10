<?php

namespace App\Tests\Integration\Service;

use App\Tests\Integration\AbstractIntegrationTestCase;
use Twig\Environment;

/**
 * Vérifie que les templates d'email qui injectent du contenu utilisateur
 * (message de contact, message acheteur, réponse admin) échappent bien le HTML.
 * MailService::send() rend ces templates avec Twig sans jamais passer par `|raw`.
 */
class MailTemplateXssTest extends AbstractIntegrationTestCase
{
    private const XSS_PAYLOAD = '<script>window.__xss_executed = true</script>';

    public function testReponseContactEchappeLeContenuUtilisateur(): void
    {
        $twig = static::getContainer()->get(Environment::class);

        $html = $twig->render('emails/contact/reply.html.twig', [
            'name'             => self::XSS_PAYLOAD,
            'reply_message'    => self::XSS_PAYLOAD,
            'original_message' => self::XSS_PAYLOAD,
        ]);

        $this->assertStringNotContainsString('<script>window.__xss_executed', $html);
        $this->assertStringContainsString('&lt;script&gt;', $html);
    }

    public function testDemandeReservationEchappeLeMessageAcheteur(): void
    {
        $twig = static::getContainer()->get(Environment::class);

        $html = $twig->render('emails/reservation/created.html.twig', [
            'animal_title'  => self::XSS_PAYLOAD,
            'buyer_message' => self::XSS_PAYLOAD,
        ]);

        $this->assertStringNotContainsString('<script>window.__xss_executed', $html);
        $this->assertStringContainsString('&lt;script&gt;', $html);
    }
}
