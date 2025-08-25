import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, CheckCircle, XCircle, Globe, Clock } from "lucide-react";

export const AnalysisCard = ({ analysis }) => {
	const getStatusIcon = (status) => {
		switch (status) {
			case 'verified':
				return <CheckCircle className="h-5 w-5 text-success" />;
			case 'suspicious':
				return <AlertTriangle className="h-5 w-5 text-warning" />;
			case 'false':
				return <XCircle className="h-5 w-5 text-destructive" />;
			default:
				return <Clock className="h-5 w-5 text-muted-foreground" />;
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'verified':
				return 'bg-success text-success-foreground';
			case 'suspicious':
				return 'bg-warning text-warning-foreground';
			case 'false':
				return 'bg-destructive text-destructive-foreground';
			default:
				return 'bg-muted text-muted-foreground';
		}
	};

	const getCredibilityColor = (score) => {
		if (score >= 80) return 'text-success';
		if (score >= 60) return 'text-warning';
		return 'text-destructive';
	};

	return (
		<Card className="w-full shadow-medium hover:shadow-strong transition-smooth animate-fade-in">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-2 flex-1">
						{getStatusIcon(analysis.status)}
						<CardTitle className="text-lg leading-tight">
							Content Analysis
						</CardTitle>
					</div>
					<div className="flex items-center gap-2">
						<Badge className={getStatusColor(analysis.status)}>
							{analysis.status.toUpperCase()}
						</Badge>
						<Badge variant="outline" className="flex items-center gap-1">
							<Globe className="h-3 w-3" />
							{analysis.language}
						</Badge>
					</div>
				</div>
			</CardHeader>
      
			<CardContent className="space-y-4">
				{/* Content Preview */}
				<div className="p-3 bg-muted rounded-md">
					<p className="text-sm text-foreground/90 line-clamp-3">
						{analysis.content}
					</p>
				</div>

				{/* Credibility Score */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium">Credibility Score</span>
						<span className={`text-sm font-bold ${getCredibilityColor(analysis.credibilityScore)}`}>
							{analysis.credibilityScore}%
						</span>
					</div>
					<Progress 
						value={analysis.credibilityScore} 
						className="h-2"
					/>
				</div>

				{/* Sources */}
				<div className="space-y-2">
					<span className="text-sm font-medium flex items-center gap-2">
						<Shield className="h-4 w-4" />
						Verified Sources
					</span>
					<div className="grid grid-cols-1 gap-2">
						{analysis.sources.map((source, index) => (
							<div key={index} className="flex items-center justify-between p-2 bg-card border rounded-md">
								<span className="text-sm">{source.name}</span>
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">{source.credibility}%</span>
									{source.verified && (
										<CheckCircle className="h-3 w-3 text-success" />
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* AI Explanation */}
				<div className="space-y-2">
					<span className="text-sm font-medium">AI Analysis</span>
					<p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
						{analysis.explanation}
					</p>
				</div>

				{/* Metadata */}
				<div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
					<span>Analyzed: {analysis.detectedAt.toLocaleDateString()}</span>
					{analysis.origin && (
						<span>Origin: {analysis.origin}</span>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
