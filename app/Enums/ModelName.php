<?php

declare(strict_types=1);

namespace App\Enums;

use Prism\Prism\Enums\Provider;

enum ModelName: string
{
    case GPT_OSS_20B = 'openai/gpt-oss-20b';
    case GPT_OSS_120B = 'openai/gpt-oss-120b';
    case QWEN3_6_27B = 'qwen/qwen3.6-27b';
    case QWEN3_8_27B = 'qwen/qwen3.8-27b';

    /**
     * @return array{id: string, name: string, description: string, provider: string}[]
     */
    public static function getAvailableModels(): array
    {
        return array_map(
            fn (ModelName $model): array => $model->toArray(),
            self::cases()
        );
    }

    public function getName(): string
    {
        return match ($this) {
            self::GPT_OSS_20B => 'GPT OSS 20B',
            self::GPT_OSS_120B => 'GPT OSS 120B',
            self::QWEN3_6_27B => 'Qwen 3.6 27B',
            self::QWEN3_8_27B => 'Qwen 3.8 27B',
        };
    }

    public function getDescription(): string
    {
        return match ($this) {
            self::GPT_OSS_20B => 'Fast and efficient, best for simpler tasks',
            self::GPT_OSS_120B => 'Powerful model, best for complex reasoning',
            self::QWEN3_6_27B => 'Qwen model, great for multilingual tasks',
            self::QWEN3_8_27B => 'Qwen large model, best for advanced tasks',
        };
    }

    public function getProvider(): Provider
    {
        return match ($this) {
            self::GPT_OSS_20B,
            self::GPT_OSS_120B,
            self::QWEN3_6_27B,
            self::QWEN3_8_27B => Provider::Groq,
        };
    }

    /**
     * @return array{id: string, name: string, description: string, provider: string}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->value,
            'name' => $this->getName(),
            'description' => $this->getDescription(),
            'provider' => $this->getProvider()->value,
        ];
    }
}
