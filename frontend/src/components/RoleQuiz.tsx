import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, User, TrendingUp, BookOpen } from 'lucide-react';
import { quizQuestions, calculateUserRole, getRoleDescription, getRoleFeatures, type QuizAnswers, type UserRole } from '@/lib/quizData';

interface RoleQuizProps {
  onComplete: (role: UserRole, answers: QuizAnswers) => void;
  onBack?: () => void;
}

const RoleQuiz: React.FC<RoleQuizProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;
  const currentAnswer = answers[currentQuestion];

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = {
      ...answers,
      [currentQuestion]: optionIndex,
    };
    setAnswers(newAnswers);

    // If this completes all questions, calculate the role
    if (Object.keys(newAnswers).length === quizQuestions.length) {
      const role = calculateUserRole(newAnswers);
      setSelectedRole(role);
    }
  };

  const handleNext = () => {
    if (currentAnswer !== undefined) {
      if (isLastQuestion && selectedRole) {
        // Show role result instead of moving to next question
        return;
      }
      setCurrentQuestion(prev => Math.min(prev + 1, quizQuestions.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentQuestion(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    if (selectedRole && Object.keys(answers).length === quizQuestions.length) {
      onComplete(selectedRole, answers);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'beginner':
        return <BookOpen className="h-8 w-8" />;
      case 'casual':
        return <User className="h-8 w-8" />;
      case 'paper_trader':
        return <TrendingUp className="h-8 w-8" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'casual':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paper_trader':
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  // Show role result after completing quiz
  if (selectedRole && Object.keys(answers).length === quizQuestions.length && isLastQuestion && currentAnswer !== undefined) {
    const roleDesc = getRoleDescription(selectedRole);
    const roleFeatures = getRoleFeatures(selectedRole);

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-4">Your Trading Profile</CardTitle>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 rounded-full ${getRoleColor(selectedRole)}`}>
              {getRoleIcon(selectedRole)}
            </div>
            <Badge variant="outline" className={`text-lg py-2 px-4 ${getRoleColor(selectedRole)}`}>
              {selectedRole.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-6">{roleDesc}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-3">Your personalized features will include:</h4>
            <ul className="space-y-2">
              {roleFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(0)}
              className="flex-1"
            >
              Retake Quiz
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1"
            >
              Complete Registration
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const question = quizQuestions[currentQuestion];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl">Let's find your trading style</CardTitle>
          <Badge variant="secondary">
            {currentQuestion + 1} of {quizQuestions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>
          <RadioGroup
            value={currentAnswer?.toString() || ''}
            onValueChange={(value) => handleAnswer(parseInt(value))}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="flex-1 cursor-pointer text-sm"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={currentQuestion === 0 ? onBack : handlePrevious}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentQuestion === 0 ? 'Back' : 'Previous'}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={currentAnswer === undefined}
            className="flex items-center gap-2"
          >
            {isLastQuestion ? 'See Results' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleQuiz;