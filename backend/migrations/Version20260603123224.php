<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260603123224 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE animal_documents (id BIGINT AUTO_INCREMENT NOT NULL, type VARCHAR(20) NOT NULL, file_url VARCHAR(500) NOT NULL, original_name VARCHAR(255) DEFAULT NULL, mime_type VARCHAR(100) NOT NULL, is_public TINYINT NOT NULL, verified_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, animal_id BIGINT NOT NULL, INDEX IDX_5A145FE78E962C16 (animal_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE animal_media (id BIGINT AUTO_INCREMENT NOT NULL, file_url VARCHAR(500) NOT NULL, original_name VARCHAR(255) DEFAULT NULL, mime_type VARCHAR(100) NOT NULL, position SMALLINT NOT NULL, is_cover TINYINT NOT NULL, created_at DATETIME NOT NULL, animal_id BIGINT NOT NULL, INDEX IDX_4BDF78F88E962C16 (animal_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE animals (id BIGINT AUTO_INCREMENT NOT NULL, name VARCHAR(120) DEFAULT NULL, title VARCHAR(180) NOT NULL, description LONGTEXT NOT NULL, sex VARCHAR(10) NOT NULL, birthdate DATE DEFAULT NULL, price NUMERIC(10, 2) NOT NULL, status VARCHAR(20) NOT NULL, city VARCHAR(120) NOT NULL, postal_code VARCHAR(20) NOT NULL, published_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, seller_id BIGINT NOT NULL, species_id BIGINT NOT NULL, breed_id BIGINT DEFAULT NULL, INDEX IDX_966C69DD8DE820D9 (seller_id), INDEX IDX_966C69DDB2A1D860 (species_id), INDEX IDX_966C69DDA8B4A30F (breed_id), INDEX idx_animals_search (status, species_id, breed_id), INDEX idx_animals_location (city, postal_code), INDEX idx_animals_price (price), INDEX idx_animals_seller (seller_id, status), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE audit_logs (id BIGINT AUTO_INCREMENT NOT NULL, action VARCHAR(120) NOT NULL, entity_type VARCHAR(120) NOT NULL, entity_id BIGINT DEFAULT NULL, old_values JSON DEFAULT NULL, new_values JSON DEFAULT NULL, ip_address VARCHAR(45) DEFAULT NULL, created_at DATETIME NOT NULL, actor_id BIGINT DEFAULT NULL, INDEX IDX_D62F285810DAF24A (actor_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE breeds (id BIGINT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, slug VARCHAR(140) NOT NULL, description LONGTEXT NOT NULL, temperament LONGTEXT DEFAULT NULL, size VARCHAR(20) DEFAULT NULL, care_level VARCHAR(20) DEFAULT NULL, image_url VARCHAR(500) DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, species_id BIGINT NOT NULL, INDEX IDX_FD953C82B2A1D860 (species_id), UNIQUE INDEX uniq_breed_species_slug (species_id, slug), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE favorites (id BIGINT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, user_id BIGINT NOT NULL, animal_id BIGINT NOT NULL, INDEX IDX_E46960F5A76ED395 (user_id), INDEX IDX_E46960F58E962C16 (animal_id), UNIQUE INDEX uniq_favorite_user_animal (user_id, animal_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE refresh_tokens (id INT AUTO_INCREMENT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reservations (id BIGINT AUTO_INCREMENT NOT NULL, status VARCHAR(20) NOT NULL, message LONGTEXT DEFAULT NULL, seller_response LONGTEXT DEFAULT NULL, expires_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, animal_id BIGINT NOT NULL, buyer_id BIGINT NOT NULL, seller_id BIGINT NOT NULL, INDEX IDX_4DA2398E962C16 (animal_id), INDEX IDX_4DA2396C755722 (buyer_id), INDEX IDX_4DA2398DE820D9 (seller_id), INDEX idx_reservations_buyer (buyer_id, status), INDEX idx_reservations_seller (seller_id, status), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reviews (id BIGINT AUTO_INCREMENT NOT NULL, rating SMALLINT NOT NULL, comment LONGTEXT DEFAULT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, seller_id BIGINT NOT NULL, buyer_id BIGINT NOT NULL, reservation_id BIGINT NOT NULL, INDEX IDX_6970EB0F8DE820D9 (seller_id), INDEX IDX_6970EB0F6C755722 (buyer_id), UNIQUE INDEX UNIQ_6970EB0FB83297E7 (reservation_id), INDEX idx_reviews_seller (seller_id, status), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE sellers (id BIGINT AUTO_INCREMENT NOT NULL, name VARCHAR(180) NOT NULL, type VARCHAR(20) NOT NULL, siret VARCHAR(14) DEFAULT NULL, description LONGTEXT DEFAULT NULL, logo_url VARCHAR(500) DEFAULT NULL, verified_status VARCHAR(20) NOT NULL, rejection_reason LONGTEXT DEFAULT NULL, address VARCHAR(255) DEFAULT NULL, city VARCHAR(120) NOT NULL, postal_code VARCHAR(20) NOT NULL, latitude NUMERIC(10, 7) DEFAULT NULL, longitude NUMERIC(10, 7) DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id BIGINT NOT NULL, UNIQUE INDEX UNIQ_AFFE6BEFA76ED395 (user_id), INDEX idx_sellers_status_city (verified_status, city), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE species (id BIGINT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, slug VARCHAR(140) NOT NULL, family VARCHAR(120) DEFAULT NULL, description LONGTEXT NOT NULL, temperament LONGTEXT DEFAULT NULL, life_expectancy_min SMALLINT DEFAULT NULL, life_expectancy_max SMALLINT DEFAULT NULL, diet_type VARCHAR(120) DEFAULT NULL, avg_monthly_cost NUMERIC(8, 2) DEFAULT NULL, care_level VARCHAR(20) DEFAULT NULL, image_url VARCHAR(500) DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_A50FF712989D9B62 (slug), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user_auth_providers (id BIGINT AUTO_INCREMENT NOT NULL, provider VARCHAR(50) NOT NULL, provider_user_id VARCHAR(255) NOT NULL, provider_email VARCHAR(180) DEFAULT NULL, provider_email_verified TINYINT NOT NULL, display_name VARCHAR(180) DEFAULT NULL, avatar_url VARCHAR(500) DEFAULT NULL, access_token_hash VARCHAR(255) DEFAULT NULL, refresh_token_encrypted LONGTEXT DEFAULT NULL, linked_at DATETIME NOT NULL, last_used_at DATETIME DEFAULT NULL, user_id BIGINT NOT NULL, INDEX IDX_8D5FD7DCA76ED395 (user_id), UNIQUE INDEX uniq_provider_user (provider, provider_user_id), UNIQUE INDEX uniq_user_provider (user_id, provider), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE users (id BIGINT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, password_hash VARCHAR(255) DEFAULT NULL, first_name VARCHAR(100) DEFAULT NULL, last_name VARCHAR(100) DEFAULT NULL, phone VARCHAR(30) DEFAULT NULL, avatar_url VARCHAR(500) DEFAULT NULL, roles JSON NOT NULL, status VARCHAR(20) NOT NULL, email_verified_at DATETIME DEFAULT NULL, last_login_at DATETIME DEFAULT NULL, terms_accepted_at DATETIME NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email), INDEX idx_users_status (status), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE animal_documents ADD CONSTRAINT FK_5A145FE78E962C16 FOREIGN KEY (animal_id) REFERENCES animals (id)');
        $this->addSql('ALTER TABLE animal_media ADD CONSTRAINT FK_4BDF78F88E962C16 FOREIGN KEY (animal_id) REFERENCES animals (id)');
        $this->addSql('ALTER TABLE animals ADD CONSTRAINT FK_966C69DD8DE820D9 FOREIGN KEY (seller_id) REFERENCES sellers (id)');
        $this->addSql('ALTER TABLE animals ADD CONSTRAINT FK_966C69DDB2A1D860 FOREIGN KEY (species_id) REFERENCES species (id)');
        $this->addSql('ALTER TABLE animals ADD CONSTRAINT FK_966C69DDA8B4A30F FOREIGN KEY (breed_id) REFERENCES breeds (id)');
        $this->addSql('ALTER TABLE audit_logs ADD CONSTRAINT FK_D62F285810DAF24A FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE breeds ADD CONSTRAINT FK_FD953C82B2A1D860 FOREIGN KEY (species_id) REFERENCES species (id)');
        $this->addSql('ALTER TABLE favorites ADD CONSTRAINT FK_E46960F5A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE favorites ADD CONSTRAINT FK_E46960F58E962C16 FOREIGN KEY (animal_id) REFERENCES animals (id)');
        $this->addSql('ALTER TABLE reservations ADD CONSTRAINT FK_4DA2398E962C16 FOREIGN KEY (animal_id) REFERENCES animals (id)');
        $this->addSql('ALTER TABLE reservations ADD CONSTRAINT FK_4DA2396C755722 FOREIGN KEY (buyer_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE reservations ADD CONSTRAINT FK_4DA2398DE820D9 FOREIGN KEY (seller_id) REFERENCES sellers (id)');
        $this->addSql('ALTER TABLE reviews ADD CONSTRAINT FK_6970EB0F8DE820D9 FOREIGN KEY (seller_id) REFERENCES sellers (id)');
        $this->addSql('ALTER TABLE reviews ADD CONSTRAINT FK_6970EB0F6C755722 FOREIGN KEY (buyer_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE reviews ADD CONSTRAINT FK_6970EB0FB83297E7 FOREIGN KEY (reservation_id) REFERENCES reservations (id)');
        $this->addSql('ALTER TABLE sellers ADD CONSTRAINT FK_AFFE6BEFA76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE user_auth_providers ADD CONSTRAINT FK_8D5FD7DCA76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE animal_documents DROP FOREIGN KEY FK_5A145FE78E962C16');
        $this->addSql('ALTER TABLE animal_media DROP FOREIGN KEY FK_4BDF78F88E962C16');
        $this->addSql('ALTER TABLE animals DROP FOREIGN KEY FK_966C69DD8DE820D9');
        $this->addSql('ALTER TABLE animals DROP FOREIGN KEY FK_966C69DDB2A1D860');
        $this->addSql('ALTER TABLE animals DROP FOREIGN KEY FK_966C69DDA8B4A30F');
        $this->addSql('ALTER TABLE audit_logs DROP FOREIGN KEY FK_D62F285810DAF24A');
        $this->addSql('ALTER TABLE breeds DROP FOREIGN KEY FK_FD953C82B2A1D860');
        $this->addSql('ALTER TABLE favorites DROP FOREIGN KEY FK_E46960F5A76ED395');
        $this->addSql('ALTER TABLE favorites DROP FOREIGN KEY FK_E46960F58E962C16');
        $this->addSql('ALTER TABLE reservations DROP FOREIGN KEY FK_4DA2398E962C16');
        $this->addSql('ALTER TABLE reservations DROP FOREIGN KEY FK_4DA2396C755722');
        $this->addSql('ALTER TABLE reservations DROP FOREIGN KEY FK_4DA2398DE820D9');
        $this->addSql('ALTER TABLE reviews DROP FOREIGN KEY FK_6970EB0F8DE820D9');
        $this->addSql('ALTER TABLE reviews DROP FOREIGN KEY FK_6970EB0F6C755722');
        $this->addSql('ALTER TABLE reviews DROP FOREIGN KEY FK_6970EB0FB83297E7');
        $this->addSql('ALTER TABLE sellers DROP FOREIGN KEY FK_AFFE6BEFA76ED395');
        $this->addSql('ALTER TABLE user_auth_providers DROP FOREIGN KEY FK_8D5FD7DCA76ED395');
        $this->addSql('DROP TABLE animal_documents');
        $this->addSql('DROP TABLE animal_media');
        $this->addSql('DROP TABLE animals');
        $this->addSql('DROP TABLE audit_logs');
        $this->addSql('DROP TABLE breeds');
        $this->addSql('DROP TABLE favorites');
        $this->addSql('DROP TABLE refresh_tokens');
        $this->addSql('DROP TABLE reservations');
        $this->addSql('DROP TABLE reviews');
        $this->addSql('DROP TABLE sellers');
        $this->addSql('DROP TABLE species');
        $this->addSql('DROP TABLE user_auth_providers');
        $this->addSql('DROP TABLE users');
    }
}
