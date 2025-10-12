'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Brain, Bell, Languages } from 'lucide-react';
import { Category, CATEGORY_LABELS, Level, LEVEL_LABELS } from '@/types/article';

interface UserSettings {
  name: string;
  role: string;
  interests: Category[];
  skillLevel: Level;
  language: 'ja' | 'en' | 'both';
  notifications: {
    mustRead: boolean;
    dailyDigest: boolean;
  };
}

const initialSettings: UserSettings = {
  name: 'デロイト太郎',
  role: '人事コンサルタント兼エンジニア',
  interests: ['tech', 'hr'],
  skillLevel: 'intermediate',
  language: 'both',
  notifications: {
    mustRead: true,
    dailyDigest: true,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(initialSettings);

  const toggleInterest = (category: Category) => {
    setSettings((prev) => ({
      ...prev,
      interests: prev.interests.includes(category)
        ? prev.interests.filter((c) => c !== category)
        : [...prev.interests, category],
    }));
  };

  const handleSkillLevelChange = (level: Level) => {
    setSettings((prev) => ({ ...prev, skillLevel: level }));
  };

  const handleLanguageChange = (lang: 'ja' | 'en' | 'both') => {
    setSettings((prev) => ({ ...prev, language: lang }));
  };

  const toggleNotification = (key: keyof UserSettings['notifications']) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" className="container mx-auto px-4 py-8" role="main">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">設定</h1>
            <p className="text-muted-foreground">
              パーソナライズされた情報キュレーションのための設定を管理します
            </p>
          </div>

          <div className="space-y-6">
            {/* プロフィール設定 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle>プロフィール</CardTitle>
                </div>
                <CardDescription>
                  あなたの役割と背景情報を設定します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    名前
                  </label>
                  <p className="text-foreground">{settings.name}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    役割
                  </label>
                  <p className="text-foreground">{settings.role}</p>
                </div>
              </CardContent>
            </Card>

            {/* 興味分野設定 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle>興味分野</CardTitle>
                </div>
                <CardDescription>
                  関心のあるカテゴリを選択してください(複数選択可)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(['tech', 'hr', 'business'] as Category[]).map((category) => (
                    <Button
                      key={category}
                      variant={
                        settings.interests.includes(category) ? 'default' : 'outline'
                      }
                      onClick={() => toggleInterest(category)}
                      className="min-h-[44px]"
                      aria-pressed={settings.interests.includes(category)}
                    >
                      {CATEGORY_LABELS[category]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* スキルレベル設定 */}
            <Card>
              <CardHeader>
                <CardTitle>技術スキルレベル</CardTitle>
                <CardDescription>
                  技術記事の難易度マッチングに使用されます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as Level[]).map((level) => (
                    <Button
                      key={level}
                      variant={settings.skillLevel === level ? 'default' : 'outline'}
                      onClick={() => handleSkillLevelChange(level)}
                      className="min-h-[44px]"
                      aria-pressed={settings.skillLevel === level}
                    >
                      {LEVEL_LABELS[level]}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  現在のレベル:{' '}
                  <span className="font-semibold text-foreground">
                    {LEVEL_LABELS[settings.skillLevel]}
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* 言語設定 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle>言語設定</CardTitle>
                </div>
                <CardDescription>
                  収集する記事の言語を選択してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={settings.language === 'ja' ? 'default' : 'outline'}
                    onClick={() => handleLanguageChange('ja')}
                    className="min-h-[44px]"
                    aria-pressed={settings.language === 'ja'}
                  >
                    日本語のみ
                  </Button>
                  <Button
                    variant={settings.language === 'en' ? 'default' : 'outline'}
                    onClick={() => handleLanguageChange('en')}
                    className="min-h-[44px]"
                    aria-pressed={settings.language === 'en'}
                  >
                    英語のみ
                  </Button>
                  <Button
                    variant={settings.language === 'both' ? 'default' : 'outline'}
                    onClick={() => handleLanguageChange('both')}
                    className="min-h-[44px]"
                    aria-pressed={settings.language === 'both'}
                  >
                    両方
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 通知設定 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle>通知設定</CardTitle>
                </div>
                <CardDescription>
                  受け取りたい通知を選択してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">必読記事の通知</h3>
                    <p className="text-sm text-muted-foreground">
                      新しい必読記事が追加されたときに通知します
                    </p>
                  </div>
                  <Button
                    variant={settings.notifications.mustRead ? 'default' : 'outline'}
                    onClick={() => toggleNotification('mustRead')}
                    className="min-h-[44px] min-w-[80px]"
                    aria-pressed={settings.notifications.mustRead}
                  >
                    {settings.notifications.mustRead ? 'ON' : 'OFF'}
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">デイリーダイジェスト</h3>
                    <p className="text-sm text-muted-foreground">
                      毎日のおすすめ記事をまとめて通知します
                    </p>
                  </div>
                  <Button
                    variant={settings.notifications.dailyDigest ? 'default' : 'outline'}
                    onClick={() => toggleNotification('dailyDigest')}
                    className="min-h-[44px] min-w-[80px]"
                    aria-pressed={settings.notifications.dailyDigest}
                  >
                    {settings.notifications.dailyDigest ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <Button size="lg" className="min-h-[44px]">
                設定を保存
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
