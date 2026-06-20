<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class UploadService
{
    private const ALLOWED_IMAGE_MIMES    = ['image/jpeg', 'image/png', 'image/webp'];
    private const ALLOWED_DOCUMENT_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
    private const MAX_AVATAR_SIZE        = 2 * 1024 * 1024;   //  2 Mo
    private const MAX_MEDIA_SIZE         = 5 * 1024 * 1024;   //  5 Mo
    private const MAX_DOCUMENT_SIZE      = 10 * 1024 * 1024;  // 10 Mo

    public function __construct(private readonly string $uploadDir)
    {
    }

    public function uploadAvatar(UploadedFile $file): string
    {
        return $this->upload($file, 'avatars', self::ALLOWED_IMAGE_MIMES, self::MAX_AVATAR_SIZE);
    }

    public function uploadAnimalMedia(UploadedFile $file): string
    {
        return $this->upload($file, 'animals', self::ALLOWED_IMAGE_MIMES, self::MAX_MEDIA_SIZE);
    }

    public function uploadAnimalDocument(UploadedFile $file): string
    {
        return $this->upload($file, 'documents', self::ALLOWED_DOCUMENT_MIMES, self::MAX_DOCUMENT_SIZE);
    }

    public function delete(string $relativePath): void
    {
        // $relativePath is like /uploads/avatars/file.jpg
        // $uploadDir is like /app/public/uploads
        $subPath = preg_replace('#^/uploads#', '', $relativePath);
        $absolute = $this->uploadDir . $subPath;
        if (is_file($absolute)) {
            unlink($absolute);
        }
    }

    private function upload(UploadedFile $file, string $subDir, array $allowedMimes, int $maxSize): string
    {
        if ($file->getSize() > $maxSize) {
            $maxMb = $maxSize / (1024 * 1024);
            throw new BadRequestHttpException("File too large. Maximum size is {$maxMb}MB.");
        }

        $mime = $file->getMimeType();
        if (!in_array($mime, $allowedMimes, true)) {
            throw new BadRequestHttpException('Unsupported file type.');
        }

        $dir = $this->uploadDir . '/' . $subDir;
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $extension = match ($mime) {
            'image/jpeg'      => 'jpg',
            'image/png'       => 'png',
            'image/webp'      => 'webp',
            'application/pdf' => 'pdf',
            default           => 'bin',
        };

        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $file->move($dir, $filename);

        return '/uploads/' . $subDir . '/' . $filename;
    }
}
