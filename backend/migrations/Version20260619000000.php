<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration annulée — la table messages reste en MySQL (schéma Merise conservé).
 * Les messages du chat sont gérés par MongoDB (collection chat_messages).
 */
final class Version20260619000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'No-op — messages table kept in MySQL, MongoDB handles chat messages independently';
    }

    public function up(Schema $schema): void {}

    public function down(Schema $schema): void {}
}
