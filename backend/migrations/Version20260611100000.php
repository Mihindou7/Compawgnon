<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260611100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add geo fields to animals (latitude, longitude, region, department, department_code)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE animals ADD latitude DECIMAL(10, 7) DEFAULT NULL, ADD longitude DECIMAL(10, 7) DEFAULT NULL, ADD region VARCHAR(100) DEFAULT NULL, ADD department VARCHAR(100) DEFAULT NULL, ADD department_code VARCHAR(10) DEFAULT NULL');
        $this->addSql('CREATE INDEX idx_animals_region ON animals (region)');
        $this->addSql('CREATE INDEX idx_animals_dept ON animals (department_code)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX idx_animals_region ON animals');
        $this->addSql('DROP INDEX idx_animals_dept ON animals');
        $this->addSql('ALTER TABLE animals DROP latitude, DROP longitude, DROP region, DROP department, DROP department_code');
    }
}
