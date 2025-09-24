import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Heart, Zap, AlertTriangle } from "lucide-react";

interface SensorData {
  timestamp: number;
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  emg: number;
  ecg: number;
}

interface TremorAnalysis {
  severity: "Normal" | "Mild" | "Moderate" | "Severe";
  frequency: number;
  confidence: number;
}

const Dashboard = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [tremorAnalysis, setTremorAnalysis] = useState<TremorAnalysis>({
    severity: "Normal",
    frequency: 0,
    confidence: 0
  });
  const [currentRecommendation, setCurrentRecommendation] = useState("");

  // Simulate realistic Parkinson's sensor data
  const generateSensorData = (timestamp: number): SensorData => {
    // Base tremor frequency for Parkinson's (4-6 Hz)
    const tremorFreq = 4.5 + Math.random() * 1.5;
    const tremorAmplitude = 0.5 + Math.random() * 2;
    
    // Simulate tremor in accelerometer data
    const tremor = Math.sin(timestamp * tremorFreq * 0.1) * tremorAmplitude;
    
    return {
      timestamp,
      accelerometer: {
        x: tremor + (Math.random() - 0.5) * 0.2,
        y: 1.0 + tremor * 0.7 + (Math.random() - 0.5) * 0.3,
        z: 0.1 + (Math.random() - 0.5) * 0.2
      },
      gyroscope: {
        x: tremor * 10 + (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 3,
        z: tremor * 8 + (Math.random() - 0.5) * 4
      },
      emg: 20 + Math.abs(tremor) * 30 + Math.random() * 10, // Muscle activity
      ecg: 75 + Math.sin(timestamp * 0.02) * 5 + Math.random() * 2 // Heart rate variation
    };
  };

  // Analyze tremor severity from recent data
  const analyzeTremor = (data: SensorData[]): TremorAnalysis => {
    if (data.length < 10) return { severity: "Normal", frequency: 0, confidence: 0 };
    
    const recent = data.slice(-20);
    const amplitudes = recent.map(d => 
      Math.sqrt(d.accelerometer.x ** 2 + d.accelerometer.y ** 2)
    );
    
    const avgAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
    const maxAmplitude = Math.max(...amplitudes);
    
    let severity: TremorAnalysis["severity"] = "Normal";
    let confidence = Math.min(95, (avgAmplitude / 3) * 100);
    
    if (avgAmplitude > 2.5) severity = "Severe";
    else if (avgAmplitude > 1.5) severity = "Moderate";
    else if (avgAmplitude > 0.8) severity = "Mild";
    
    return {
      severity,
      frequency: 4.5 + (avgAmplitude * 2),
      confidence: Math.round(confidence)
    };
  };

  // Get exercise recommendations based on tremor analysis
  const getRecommendation = (analysis: TremorAnalysis): string => {
    const recommendations = {
      Normal: [
        "Continue regular movement exercises",
        "Practice fine motor skills with writing exercises",
        "Maintain good posture throughout the day"
      ],
      Mild: [
        "Try deep breathing exercises to reduce stress",
        "Practice hand weight exercises (light weights)",
        "Focus on slow, controlled movements"
      ],
      Moderate: [
        "Take a break and rest your hands",
        "Try progressive muscle relaxation",
        "Consider medication timing review with doctor"
      ],
      Severe: [
        "Avoid fine motor tasks temporarily",
        "Use adaptive devices for daily activities",
        "Contact healthcare provider if symptoms persist"
      ]
    };

    const options = recommendations[analysis.severity];
    return options[Math.floor(Date.now() / 10000) % options.length];
  };

  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const newData = generateSensorData(Date.now());
      
      setSensorData(prev => {
        const updated = [...prev, newData].slice(-50); // Keep last 50 points
        const analysis = analyzeTremor(updated);
        setTremorAnalysis(analysis);
        setCurrentRecommendation(getRecommendation(analysis));
        return updated;
      });
    }, 100); // 10 Hz sampling rate

    return () => clearInterval(interval);
  }, [isRecording]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Normal": return "medical-success";
      case "Mild": return "medical-warning";
      case "Moderate": return "medical-warning";
      case "Severe": return "medical-danger";
      default: return "muted";
    }
  };

  const chartData = sensorData.slice(-30).map((data, index) => ({
    time: index,
    accelerometer: Math.sqrt(data.accelerometer.x ** 2 + data.accelerometer.y ** 2),
    gyroscope: Math.sqrt(data.gyroscope.x ** 2 + data.gyroscope.y ** 2),
    emg: data.emg,
    heartRate: data.ecg
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Parkinson's Monitoring System</h1>
            <p className="text-muted-foreground mt-1">Real-time tremor and movement analysis</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline"
              className={`${isRecording ? 'bg-medical-success text-medical-success-foreground' : 'bg-muted'}`}
            >
              {isRecording ? "Recording" : "Stopped"}
            </Badge>
            <Button
              onClick={() => setIsRecording(!isRecording)}
              variant={isRecording ? "secondary" : "default"}
            >
              {isRecording ? "Stop" : "Start"} Monitoring
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Tremor Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tremorAnalysis.severity}</div>
              <Badge className={`mt-2 bg-${getSeverityColor(tremorAnalysis.severity)}`}>
                {tremorAnalysis.confidence}% confidence
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tremorAnalysis.frequency.toFixed(1)} Hz</div>
              <p className="text-xs text-muted-foreground mt-2">Typical PD: 4-6 Hz</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Heart Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sensorData.length > 0 ? Math.round(sensorData[sensorData.length - 1].ecg) : 0} BPM
              </div>
              <p className="text-xs text-muted-foreground mt-2">Within normal range</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                EMG Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sensorData.length > 0 ? Math.round(sensorData[sensorData.length - 1].emg) : 0} μV
              </div>
              <p className="text-xs text-muted-foreground mt-2">Muscle activation level</p>
            </CardContent>
          </Card>
        </div>

        {/* Recommendation Alert */}
        {currentRecommendation && (
          <Card className="border-accent bg-accent/5">
            <CardHeader>
              <CardTitle className="text-accent flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recommended Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accent-foreground">{currentRecommendation}</p>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Accelerometer + Gyroscope</CardTitle>
                <CardDescription>Motion sensor data analysis</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="accelerometer"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      name="Accelerometer"
                    />
                    <Line
                      type="monotone"
                      dataKey="gyroscope"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={2}
                      dot={false}
                      name="Gyroscope"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Motion Sensor Features */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="text-sm font-medium text-primary">Tremor</div>
                <div className="text-xs text-muted-foreground mt-1">Rhythmic involuntary movement</div>
              </Card>
              <Card className="p-3">
                <div className="text-sm font-medium text-primary">Bradykinesia</div>
                <div className="text-xs text-muted-foreground mt-1">Slowness of movement</div>
              </Card>
              <Card className="p-3">
                <div className="text-sm font-medium text-primary">Gait</div>
                <div className="text-xs text-muted-foreground mt-1">Walking pattern analysis</div>
              </Card>
              <Card className="p-3">
                <div className="text-sm font-medium text-primary">Postural Instability</div>
                <div className="text-xs text-muted-foreground mt-1">Balance & coordination</div>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>EMG Signal</CardTitle>
                <CardDescription>Muscle activity monitoring</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="emg"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* EMG Features */}
            <div className="grid grid-cols-1 gap-3">
              <Card className="p-3">
                <div className="text-sm font-medium text-accent">Muscle Rigidity</div>
                <div className="text-xs text-muted-foreground mt-1">Stiffness & resistance measurement</div>
              </Card>
              <Card className="p-3">
                <div className="text-sm font-medium text-accent">Dyskinesia</div>
                <div className="text-xs text-muted-foreground mt-1">Involuntary muscle movements</div>
              </Card>
            </div>
          </div>
        </div>

        {/* ECG Chart */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ECG Signal</CardTitle>
              <CardDescription>Heart rate variability monitoring</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    stroke="hsl(var(--medical-danger))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* ECG Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-3">
              <div className="text-sm font-medium text-medical-danger">Autonomic Dysfunction</div>
              <div className="text-xs text-muted-foreground mt-1">Nervous system irregularities</div>
            </Card>
            <Card className="p-3">
              <div className="text-sm font-medium text-medical-danger">Fatigue</div>
              <div className="text-xs text-muted-foreground mt-1">Energy level assessment</div>
            </Card>
            <Card className="p-3">
              <div className="text-sm font-medium text-medical-danger">Sleep Disturbances</div>
              <div className="text-xs text-muted-foreground mt-1">Rest quality monitoring</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;