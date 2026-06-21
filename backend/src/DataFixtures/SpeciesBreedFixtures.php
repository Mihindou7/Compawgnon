<?php

namespace App\DataFixtures;

use App\Entity\Breed;
use App\Entity\Species;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class SpeciesBreedFixtures extends Fixture
{
    private const CATALOGUE = [
        [
            'name' => 'Chien', 'slug' => 'chien', 'family' => 'Mammifère',
            'image_url' => '/uploads/species/chien.jpg',
            'description' => 'Le chien est le meilleur ami de l\'homme. Fidèle et affectueux, il s\'adapte à tous les modes de vie.',
            'temperament' => 'Loyal, affectueux, joueur, protecteur',
            'life_min' => 10, 'life_max' => 15, 'diet' => 'Carnivore',
            'cost' => 120.00, 'care' => 'medium',
            'breeds' => [
                ['name' => 'Golden Retriever', 'slug' => 'golden-retriever', 'size' => 'large', 'care' => 'medium',
                 'description' => 'Chien doux et patient, idéal en famille. Très intelligent et facile à éduquer.',
                 'temperament' => 'Doux, intelligent, joueur, affectueux'],
                ['name' => 'Labrador', 'slug' => 'labrador', 'size' => 'large', 'care' => 'easy',
                 'description' => 'Race très polyvalente, le Labrador est énergique et très sociable.',
                 'temperament' => 'Énergique, social, obéissant'],
                ['name' => 'Berger Allemand', 'slug' => 'berger-allemand', 'size' => 'large', 'care' => 'medium',
                 'description' => 'Chien de travail polyvalent, très intelligent et courageux.',
                 'temperament' => 'Courageux, intelligent, protecteur'],
                ['name' => 'Cavalier King Charles', 'slug' => 'cavalier-king-charles', 'size' => 'small', 'care' => 'easy',
                 'description' => 'Petit chien de compagnie doux et affectueux, parfait pour les appartements.',
                 'temperament' => 'Doux, sociable, calme'],
            ],
        ],
        [
            'name' => 'Chat', 'slug' => 'chat', 'family' => 'Mammifère',
            'image_url' => '/uploads/species/chat.jpg',
            'description' => 'Le chat est un animal indépendant et élégant. Il apporte douceur et sérénité à son foyer.',
            'temperament' => 'Indépendant, curieux, affectueux à sa façon',
            'life_min' => 12, 'life_max' => 18, 'diet' => 'Carnivore',
            'cost' => 80.00, 'care' => 'easy',
            'breeds' => [
                ['name' => 'Persan', 'slug' => 'persan', 'size' => 'medium', 'care' => 'high',
                 'description' => 'Chat calme et doux, appréciant la vie d\'intérieur. Son pelage long nécessite un entretien régulier.',
                 'temperament' => 'Calme, doux, placide'],
                ['name' => 'Maine Coon', 'slug' => 'maine-coon', 'size' => 'large', 'care' => 'medium',
                 'description' => 'Grande race américaine au caractère de chien. Sociable et joueur.',
                 'temperament' => 'Sociable, joueur, intelligent'],
                ['name' => 'British Shorthair', 'slug' => 'british-shorthair', 'size' => 'medium', 'care' => 'easy',
                 'description' => 'Chat tranquille et facile à vivre, idéal pour les familles.',
                 'temperament' => 'Calme, doux, sociable'],
            ],
        ],
        [
            'name' => 'Lapin', 'slug' => 'lapin', 'family' => 'Mammifère',
            'image_url' => '/uploads/species/lapin.jpg',
            'description' => 'Petit herbivore doux et silencieux, le lapin est un compagnon idéal pour les petits espaces.',
            'temperament' => 'Doux, curieux, sociable',
            'life_min' => 7, 'life_max' => 12, 'diet' => 'Herbivore',
            'cost' => 40.00, 'care' => 'easy',
            'breeds' => [
                ['name' => 'Nain de Hollande', 'slug' => 'nain-de-hollande', 'size' => 'small', 'care' => 'easy',
                 'description' => 'Très petit lapin au caractère doux, parfait pour les enfants.',
                 'temperament' => 'Doux, calme, curieux'],
                ['name' => 'Rex', 'slug' => 'rex', 'size' => 'medium', 'care' => 'easy',
                 'description' => 'Lapin au pelage velours particulièrement doux, très affectueux.',
                 'temperament' => 'Affectueux, joueur, calme'],
            ],
        ],
        [
            'name' => 'Oiseau', 'slug' => 'oiseau', 'family' => 'Oiseau',
            'image_url' => '/uploads/species/oiseau.jpg',
            'description' => 'Les oiseaux de compagnie apportent gaieté et chant à la maison. Certaines espèces peuvent être dressées.',
            'temperament' => 'Variable selon l\'espèce, souvent vif et curieux',
            'life_min' => 5, 'life_max' => 20, 'diet' => 'Granivore ou frugivore',
            'cost' => 30.00, 'care' => 'easy',
            'breeds' => [
                ['name' => 'Canari', 'slug' => 'canari', 'size' => 'small', 'care' => 'easy',
                 'description' => 'Petit oiseau chanteur très populaire, idéal pour débuter.',
                 'temperament' => 'Chanteur, calme, discret'],
                ['name' => 'Perruche', 'slug' => 'perruche', 'size' => 'small', 'care' => 'easy',
                 'description' => 'Oiseau sociable qui apprécie la compagnie. Peut apprendre à parler.',
                 'temperament' => 'Joueur, sociable, curieux'],
            ],
        ],
        [
            'name' => 'Rongeur', 'slug' => 'rongeur', 'family' => 'Mammifère',
            'image_url' => '/uploads/species/rongeur.jpg',
            'description' => 'Les rongeurs sont de petits animaux attachants et faciles à entretenir, idéaux pour les débutants.',
            'temperament' => 'Curieux, actif, sociable',
            'life_min' => 2, 'life_max' => 8, 'diet' => 'Omnivore',
            'cost' => 20.00, 'care' => 'easy',
            'breeds' => [
                ['name' => 'Cochon d\'Inde', 'slug' => 'cochon-d-inde', 'size' => 'small', 'care' => 'easy',
                 'description' => 'Animal très sociable qui apprécie la compagnie. Parfait pour les enfants.',
                 'temperament' => 'Doux, sociable, peu mordeur'],
                ['name' => 'Hamster Syrien', 'slug' => 'hamster-syrien', 'size' => 'small', 'care' => 'easy',
                 'description' => 'Petit rongeur solitaire et nocturne, très populaire comme animal de compagnie.',
                 'temperament' => 'Indépendant, curieux, actif la nuit'],
            ],
        ],
        [
            'name' => 'Reptile', 'slug' => 'reptile', 'family' => 'Reptile',
            'image_url' => '/uploads/species/reptile.jpg',
            'description' => 'Les reptiles sont des animaux fascinants pour les passionnés. Ils nécessitent un environnement spécifique.',
            'temperament' => 'Calme, peu interactif, captivant',
            'life_min' => 5, 'life_max' => 30, 'diet' => 'Variable (carnivore, herbivore)',
            'cost' => 60.00, 'care' => 'high',
            'breeds' => [
                ['name' => 'Dragon Barbu', 'slug' => 'dragon-barbu', 'size' => 'medium', 'care' => 'high',
                 'description' => 'Lézard australien très populaire, docile et facile à manipuler.',
                 'temperament' => 'Docile, curieux, actif le jour'],
                ['name' => 'Gecko Léopard', 'slug' => 'gecko-leopard', 'size' => 'small', 'care' => 'medium',
                 'description' => 'Petit lézard nocturne idéal pour débuter avec les reptiles.',
                 'temperament' => 'Calme, nocturne, facile à manipuler'],
            ],
        ],
        [
            'name' => 'Poisson', 'slug' => 'poisson', 'family' => 'Poisson',
            'image_url' => '/uploads/species/poisson.jpg',
            'description' => 'Les poissons d\'aquarium sont apaisants et décoratifs. Un aquarium bien entretenu est un vrai spectacle.',
            'temperament' => 'Paisible, silencieux',
            'life_min' => 2, 'life_max' => 15, 'diet' => 'Omnivore ou carnivore',
            'cost' => 25.00, 'care' => 'medium',
            'breeds' => [
                ['name' => 'Combattant', 'slug' => 'combattant', 'size' => 'small', 'care' => 'easy',
                 'description' => 'Poisson magnifique aux couleurs vives, à garder seul.',
                 'temperament' => 'Territorial, solitaire, élégant'],
            ],
        ],
        [
            'name' => 'Furet', 'slug' => 'furet', 'family' => 'Mammifère',
            'image_url' => '/uploads/species/furet.jpg',
            'description' => 'Le furet est un animal joueur et curieux, qui s\'attache fortement à son maître.',
            'temperament' => 'Joueur, espiègle, affectueux',
            'life_min' => 6, 'life_max' => 10, 'diet' => 'Carnivore strict',
            'cost' => 70.00, 'care' => 'high',
            'breeds' => [
                ['name' => 'Furet domestique', 'slug' => 'furet-domestique', 'size' => 'small', 'care' => 'high',
                 'description' => 'Animal vif et joueur qui nécessite beaucoup d\'interactions et d\'espace.',
                 'temperament' => 'Espiègle, affectueux, curieux'],
            ],
        ],
    ];

    public function load(ObjectManager $em): void
    {
        foreach (self::CATALOGUE as $data) {
            $species = new Species();
            $species->setName($data['name']);
            $species->setSlug($data['slug']);
            $species->setFamily($data['family']);
            $species->setDescription($data['description']);
            $species->setTemperament($data['temperament']);
            $species->setLifeExpectancyMin($data['life_min']);
            $species->setLifeExpectancyMax($data['life_max']);
            $species->setDietType($data['diet']);
            $species->setAvgMonthlyCost((string) $data['cost']);
            $species->setCareLevel($data['care']);
            $species->setImageUrl($data['image_url'] ?? null);
            $em->persist($species);
            $this->addReference('species-' . $data['slug'], $species);

            foreach ($data['breeds'] as $b) {
                $breed = new Breed();
                $breed->setSpecies($species);
                $breed->setName($b['name']);
                $breed->setSlug($b['slug']);
                $breed->setDescription($b['description']);
                $breed->setTemperament($b['temperament']);
                $breed->setSize($b['size']);
                $breed->setCareLevel($b['care']);
                $em->persist($breed);
                $this->addReference('breed-' . $b['slug'], $breed);
            }
        }

        $em->flush();
    }

    public function getDependencies(): array
    {
        return [];
    }
}
