import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Check, Smartphone, Wifi, WifiOff, Zap, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Install = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const navigate = useNavigate();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      navigate('/dashboard');
    }
  };

  const features = [
    {
      icon: Smartphone,
      title: 'Install ke Home Screen',
      description: 'Akses terus dari home screen tanpa buka browser'
    },
    {
      icon: Zap,
      title: 'Loading Pantas',
      description: 'Cache assets untuk loading yang lebih laju'
    },
    {
      icon: WifiOff,
      title: 'Offline Support',
      description: 'Boleh guna walaupun tiada internet'
    },
    {
      icon: RefreshCw,
      title: 'Auto Update',
      description: 'Update secara automatik bila ada versi baru'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <img 
            src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" 
            alt="ACS Legacy" 
            className="w-20 h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">ACS Legacy</h1>
          <p className="text-muted-foreground">CRM System</p>
        </div>

        {/* Main Card */}
        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {isInstalled ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  App Sudah Diinstall
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Install App
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isInstalled 
                ? 'Anda sudah install ACS Legacy. Buka dari home screen anda.'
                : 'Install ACS Legacy untuk pengalaman terbaik'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInstalled ? (
              <Button 
                className="w-full" 
                onClick={() => navigate('/dashboard')}
              >
                Pergi ke Dashboard
              </Button>
            ) : isInstallable ? (
              <Button 
                className="w-full" 
                onClick={handleInstall}
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                Install Sekarang
              </Button>
            ) : (
              <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Cara Install:</p>
                <p><strong>iOS:</strong> Tap Share → Add to Home Screen</p>
                <p><strong>Android:</strong> Menu → Install App / Add to Home Screen</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border">
              <CardContent className="p-4 text-center">
                <feature.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="text-sm font-medium text-foreground">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Kembali ke Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
