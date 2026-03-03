import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { getAllAchievements, getAchievementStats } from './AchievementService';

function AchievementSection({ theme }) {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ total: 0, unlocked: 0, locked: 0 });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const all = await getAllAchievements();
    const achievementStats = await getAchievementStats();
    setAchievements(all);
    setStats(achievementStats);
  };

  const renderAchievement = ({ item }) => (
    <View style={[styles.achievementItem, { backgroundColor: item.unlocked ? theme.colors.primary + '15' : theme.colors.gray }]}>
      <Text style={styles.achievementIcon}>{item.icon}</Text>
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.achievementDesc, { color: theme.colors.textLight }]}>{item.description}</Text>
        {!item.unlocked && item.progress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: theme.colors.primary }]} />
          </View>
        )}
      </View>
      {item.unlocked && <Text style={styles.checkmark}>✅</Text>}
    </View>
  );

  return (
    <View>
      <TouchableOpacity 
        style={[styles.achievementCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.achievementHeader}>
          <Text style={styles.achievementIconLarge}>🏅</Text>
          <View style={styles.achievementStats}>
            <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>成就徽章</Text>
            <Text style={[styles.achievementCount, { color: theme.colors.textLight }]}>
              已解锁 {stats.unlocked} / {stats.total}
            </Text>
          </View>
          <Text style={[styles.arrow, { color: theme.colors.textLight }]}>›</Text>
        </View>
        <View style={styles.unlockedPreview}>
          {achievements.filter(a => a.unlocked).slice(0, 5).map((a, i) => (
            <Text key={i} style={styles.previewIcon}>{a.icon}</Text>
          ))}
          {stats.unlocked > 5 && <Text style={[styles.moreIcon, { color: theme.colors.textLight }]}>+{stats.unlocked - 5}</Text>}
        </View>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>🏅 成就列表</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={[styles.closeButton, { color: theme.colors.primary }]}>✕ 关闭</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={achievements}
              keyExtractor={(item) => item.id}
              renderItem={renderAchievement}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  achievementCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIconLarge: {
    fontSize: 36,
    marginRight: 12,
  },
  achievementStats: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementCount: {
    fontSize: 13,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
  },
  unlockedPreview: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E6EB',
    gap: 8,
  },
  previewIcon: {
    fontSize: 24,
  },
  moreIcon: {
    fontSize: 14,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '600',
  },
  achievementDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E6EB',
    borderRadius: 2,
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  checkmark: {
    fontSize: 20,
    marginLeft: 8,
  },
});

export default AchievementSection;
