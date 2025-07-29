⏺ 📋 Share Space 功能完整規格書 v2.0

  1. 功能概述

  核心目標

  讓用戶可以將自己的 Prompt Space 分享給其他用戶，實現協作功能。

  功能範圍

  - ✅ Space 層級分享（包含所有 folders 和 prompts）
  - ✅ 三種權限：owner / edit / view
  - ✅ Email 邀請機制（未註冊用戶引導註冊）
  - ✅ 個別權限設定與後續修改
  - ✅ 智能批量處理（最多 500 用戶/空間）
  - ✅ 實時數據同步
  - ❌ 暫不實現：Email 通知、版本控制、審計日誌

  ---
  2. 權限模型

  簡化權限設計

  interface UserRole {
    owner: {
      description: "空間擁有者",
      permissions: "完全控制權（空間管理 + 內容操作 + 分享管理）"
    },

    edit: {
      description: "編輯者",
      permissions: "可操作 folder  name, description, prompt name shortcut, content，但不能管理空間本身"
    },

    view: {
      description: "查看者",
      permissions: "只能查看所有內容"
    }
  }

  具體權限矩陣

  const PERMISSIONS = {
    // 空間管理
    space_settings: ['owner'],
    space_sharing: ['owner'],
    space_delete: ['owner'],

    // 內容操作
    content_create: ['owner', 'edit'],
    content_read: ['owner', 'edit', 'view'],
    content_update: ['owner', 'edit'],
    content_delete: ['owner', 'edit'],
  };

  權限設定規則

  const PERMISSION_RULES = {
    defaultPermission: 'view',           // 新增 email 預設權限
    batchPermission: 'unified',          // 批量操作使用統一權限
    permissionChange: 'supported',       // 支援後續修改權限
    onlyOwnerCanShare: true,            // 只有 owner 可以管理分享
  };

  ---
  3. 數據模型

  新增集合：space_shares

  interface SpaceShare {
    id: string;                    // Firestore document ID
    spaceId: string;              // 關聯 prompt_spaces.id
    ownerUserId: string;          // 空間擁有者 ID
    sharedWithEmail: string;      // 被分享的 email 地址
    sharedWithUserId?: string;    // 如果已註冊，關聯 users.id
    permission: 'view' | 'edit';  // 權限級別（owner 不存在此表）
    status: 'active' | 'revoked'; // 分享狀態
    createdAt: Date;              // 創建時間
    updatedAt: Date;              // 更新時間
  }

  Firestore 索引需求

  const REQUIRED_INDEXES = [
    // 查詢用戶可訪問的空間
    ['sharedWithUserId', 'status'],
    ['sharedWithEmail', 'status'],

    // 查詢空間的分享列表
    ['spaceId', 'status'],
    ['spaceId', 'ownerUserId'],

    // 權限查詢優化
    ['spaceId', 'sharedWithUserId', 'status'],
  ];

  ---
  4. API 設計

  A. 分享管理 API

  GET /api/v1/prompt-spaces/{spaceId}/shares

  // 獲取分享列表（僅 owner）
  interface GetSharesResponse {
    shares: {
      id: string;
      email: string;
      userId?: string;
      permission: 'view' | 'edit';
      status: 'active' | 'revoked';
      createdAt: string;
      updatedAt: string;
    }[];
    total: number;
    pagination?: {
      page: number;
      limit: number;
      hasMore: boolean;
    };
  }

  POST /api/v1/prompt-spaces/{spaceId}/shares

  // 創建分享（智能批量處理）
  interface CreateSharesRequest {
    shares: {
      email: string;
      permission: 'view' | 'edit';
    }[];
  }

  interface CreateSharesResponse {
    success: {
      email: string;
      shareId: string;
      inviteLink: string;
    }[];
    failed: {
      email: string;
      reason: string;
    }[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }

  PUT /api/v1/prompt-spaces/{spaceId}/shares

  // 批量更新權限（僅 owner）
  interface UpdateSharesRequest {
    shares: {
      email: string;
      permission: 'view' | 'edit';
    }[];
  }

  interface UpdateSharesResponse {
    updated: string[];           // 成功更新的 email
    failed: {
      email: string;
      reason: string;
    }[];
  }

  DELETE /api/v1/prompt-spaces/{spaceId}/shares

  // 批量刪除分享（僅 owner）
  interface DeleteSharesRequest {
    emails: string[];
  }

  interface DeleteSharesResponse {
    deleted: string[];           // 成功刪除的 email
    failed: {
      email: string;
      reason: string;
    }[];
  }

  B. 邀請處理 API

  GET /api/v1/invites/{shareId}

  // 處理邀請連結訪問
  interface InviteInfoResponse {
    spaceId: string;
    spaceName: string;
    ownerName: string;
    permission: 'view' | 'edit';
    needsRegistration: boolean;
    email: string;
    isValid: boolean;
    expiresAt: string;
    createdAt: string;
  }

  POST /api/v1/invites/{shareId}/accept

  // 接受邀請（註冊後自動調用）
  interface AcceptInviteRequest {
    userId: string;
  }

  interface AcceptInviteResponse {
    success: boolean;
    spaceId: string;
    permission: 'view' | 'edit';
    redirectUrl: string;
  }

  C. 擴展現有 API

  GET /api/v1/prompt-spaces

  // 擴展現有 API，包含 shared spaces
  interface PromptSpacesResponse {
    ownedSpaces: PromptSpace[];
    sharedSpaces: {
      space: PromptSpace;
      permission: 'view' | 'edit';
      sharedBy: string;
      sharedAt: string;
    }[];
  }

  ---
  5. 前端實現

  A. 更新 spaceSettingsDialog.tsx

  完整組件結構

  const SpaceSettingsDialog = ({ spaceId, currentName, isOpen, onClose }) => {
    // 狀態管理
    const [spaceName, setSpaceName] = useState(currentName);
    const [isRenaming, setIsRenaming] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit'>('view');
    const [sharedEmails, setSharedEmails] = useState<{
      email: string;
      permission: 'view' | 'edit';
      id?: string;
    }[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // API 操作
    const { renameSpace } = usePromptSpaceActions();

    // 載入分享列表
    useEffect(() => {
      if (isOpen) {
        loadSharedEmails();
      }
    }, [isOpen]);

    const loadSharedEmails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/prompt-spaces/${spaceId}/shares`);
        const data = await response.json();
        setSharedEmails(data.shares.map(share => ({
          email: share.email,
          permission: share.permission,
          id: share.id
        })));
      } catch (error) {
        console.error('Failed to load shares:', error);
      } finally {
        setLoading(false);
      }
    };

    // Email 管理
    const handleAddEmail = () => {
      if (emailInput.trim() && !sharedEmails.find(item => item.email === emailInput.trim())) {
        setSharedEmails([...sharedEmails, {
          email: emailInput.trim(),
          permission: selectedPermission
        }]);
        setEmailInput("");
        setSelectedPermission('view'); // 重置為預設值
      }
    };

    const handlePermissionChange = (email: string, newPermission: 'view' | 'edit') => {
      setSharedEmails(sharedEmails.map(item =>
        item.email === email ? { ...item, permission: newPermission } : item
      ));
    };

    const handleRemoveEmail = (emailToRemove: string) => {
      setSharedEmails(sharedEmails.filter(item => item.email !== emailToRemove));
      setSelectedEmails(selectedEmails.filter(email => email !== emailToRemove));
    };

    // 批量操作
    const handleSelectEmail = (email: string, isSelected: boolean) => {
      if (isSelected) {
        setSelectedEmails([...selectedEmails, email]);
      } else {
        setSelectedEmails(selectedEmails.filter(e => e !== email));
      }
    };

    const handleSelectAll = (isSelected: boolean) => {
      if (isSelected) {
        setSelectedEmails(sharedEmails.map(item => item.email));
      } else {
        setSelectedEmails([]);
      }
    };

    const handleBatchDelete = () => {
      setSharedEmails(sharedEmails.filter(item => !selectedEmails.includes(item.email)));
      setSelectedEmails([]);
    };

    // 保存分享設定
    const handleSaveSharing = async () => {
      try {
        setLoading(true);

        // 分批處理
        const BATCH_SIZE = 50;
        const batches = chunk(sharedEmails, BATCH_SIZE);

        for (const batch of batches) {
          const response = await fetch(`/api/v1/prompt-spaces/${spaceId}/shares`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shares: batch.map(({ email, permission }) => ({ email, permission }))
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save sharing settings');
          }
        }

        // 重新載入分享列表
        await loadSharedEmails();

      } catch (error) {
        console.error('Failed to save sharing settings:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Space Settings</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Manage your workspace name and sharing settings
            </p>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* 空間名稱區塊 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Space Name</h3>
              <div className="flex items-center gap-2">
                <Input
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder="Enter space name"
                  disabled={isRenaming}
                  maxLength={50}
                  className="flex-1"
                />
                <Button
                  onClick={handleRenameSubmit}
                  disabled={!spaceName.trim() || spaceName.trim() === currentName || isRenaming}
                  size="sm"
                  className="px-4"
                >
                  {isRenaming ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Name"
                  )}
                </Button>
              </div>
            </div>

            {/* 分享設定區塊 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Sharing Settings</h3>

              {/* Email 輸入區塊 */}
              <div className="flex gap-2">
                <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />
                <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-3"
                  disabled={!emailInput.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* 批量操作控制 */}
              <div className="h-[48px] flex items-center">
                {sharedEmails.length >= 2 && (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-gray-25 w-full 
  h-[44px]">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                      <span className="text-sm text-gray-600">Select All</span>
                    </div>
                    <div className="min-w-[100px] flex justify-end">
                      {selectedEmails.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBatchDelete}
                          className="h-[30px] px-3 bg-rose-500 text-white hover:bg-rose-600"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete ({selectedEmails.length})
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 分享列表 */}
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {sharedEmails.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center">
                        {sharedEmails.length >= 2 ? (
                          <Checkbox
                            checked={selectedEmails.includes(item.email)}
                            onCheckedChange={(checked) => handleSelectEmail(item.email, checked as boolean)}
                          />
                        ) : null}
                      </div>
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm flex-1">{item.email}</span>

                      {/* 權限選擇器 */}
                      <Select 
                        value={item.permission} 
                        onValueChange={(value) => handlePermissionChange(item.email, value as 'view' | 'edit')}
                      >
                        <SelectTrigger className="w-16 h-6">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleRemoveEmail(item.email)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {sharedEmails.length === 0 && (
                <p className="text-sm text-gray-500 italic">Not shared with anyone yet</p>
              )}

              <p className="text-xs text-gray-500">
                Once shared, others will be able to view and edit the contents of this workspace based on their
  permission level.
              </p>

              {/* 保存分享設定按鈕 */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSharing}
                  disabled={loading}
                  size="sm"
                  className="px-4"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Sharing Settings"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isRenaming || loading}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  B. 更新 promptSpaceSelector.tsx

  // 顯示 owned 和 shared spaces
  const PromptSpaceSelector = () => {
    const { ownedSpaces, sharedSpaces, currentSpaceId } = usePromptSpaceStore();

    return (
      <DropdownMenu>
        <DropdownMenuContent align="start" className="w-56 p-2 mt-2">
          {/* Owned Spaces */}
          {ownedSpaces.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                My Spaces
              </div>
              {ownedSpaces.map((space, index) => (
                <DropdownMenuItem
                  key={space.id}
                  onClick={() => handleSpaceChange(space.id)}
                  className={`cursor-pointer flex items-center justify-between ${
                    currentSpaceId === space.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Crown className="h-3 w-3 text-yellow-500" />
                    <span className="flex-1 truncate">{space.name}</span>
                  </div>
                  {space.name !== 'promptSpace-default' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => handleDeleteClick(e, space)}
                      title="delete"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}

          {/* Shared Spaces */}
          {sharedSpaces.length > 0 && (
            <>
              {ownedSpaces.length > 0 && <div className="border-t my-2" />}
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shared with Me
              </div>
              {sharedSpaces.map(({ space, permission, sharedBy }) => (
                <DropdownMenuItem
                  key={space.id}
                  onClick={() => handleSpaceChange(space.id)}
                  className={`cursor-pointer flex items-center justify-between ${
                    currentSpaceId === space.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-blue-500" />
                    <span className="flex-1 truncate">{space.name}</span>
                    <Badge variant={permission === 'edit' ? 'default' : 'secondary'} className="text-xs">
                      {permission}
                    </Badge>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  C. 新增 /invite/[shareId] 頁面

  // app/invite/[shareId]/page.tsx
  const InvitePage = ({ params: { shareId } }) => {
    const [invite, setInvite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const loadInvite = async () => {
        try {
          const response = await fetch(`/api/v1/invites/${shareId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Invalid invite');
          }

          setInvite(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      loadInvite();
    }, [shareId]);

    if (loading) {
      return <InviteLoadingPage />;
    }

    if (error || !invite?.isValid) {
      return <InvalidInvitePage error={error} />;
    }

    if (invite.needsRegistration) {
      return (
        <QuickSignUpPage 
          prefilledEmail={invite.email}
          spaceName={invite.spaceName}
          ownerName={invite.ownerName}
          permission={invite.permission}
          shareId={shareId}
        />
      );
    }

    // 自動登入並跳轉
    return <AutoLoginAndRedirect spaceId={invite.spaceId} />;
  };

  ---
  6. 技術實現細節

  A. 權限檢查中間件

  // 統一權限檢查
  const spaceAccessMiddleware = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const spaceId = req.params.spaceId;

    const userRole = await getUserSpaceRole(userId, spaceId);
    if (!userRole) {
      return res.status(403).json({error: 'No access to this space'});
    }

    req.userRole = userRole;
    req.userPermissions = getPermissionsForRole(userRole);
    next();
  };

  // 角色檢查函數
  const getUserSpaceRole = async (userId: string, spaceId: string) => {
    // 檢查是否為 owner
    const space = await db.collection('prompt_spaces').doc(spaceId).get();
    if (space.data()?.userId === userId) return 'owner';

    // 檢查是否有分享權限
    const shareQuery = await db.collection('space_shares')
      .where('spaceId', '==', spaceId)
      .where('sharedWithUserId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    return shareQuery.empty ? null : shareQuery.docs[0].data().permission;
  };

  // 權限檢查函數
  const getPermissionsForRole = (role: string) => {
    const permissions = {
      owner: ['read', 'write', 'share', 'delete'],
      edit: ['read', 'write'],
      view: ['read']
    };
    return permissions[role] || [];
  };

  B. 智能批量處理實現

  // 後端批量分享處理
  const createBulkShares = async (spaceId: string, shares: {email: string, permission: string}[], ownerUserId:
  string) => {
    const BATCH_SIZE = 50;
    const results = {
      success: [],
      failed: [],
      summary: { total: shares.length, successful: 0, failed: 0 }
    };

    // 分批處理
    const batches = chunk(shares, BATCH_SIZE);

    for (const batch of batches) {
      const firestoreBatch = db.batch();

      for (const { email, permission } of batch) {
        try {
          // 驗證 email 格式
          if (!isValidEmail(email)) {
            results.failed.push({email, reason: 'Invalid email format'});
            continue;
          }

          // 檢查是否已存在
          const existingQuery = await db.collection('space_shares')
            .where('spaceId', '==', spaceId)
            .where('sharedWithEmail', '==', email)
            .limit(1)
            .get();

          if (!existingQuery.empty) {
            results.failed.push({email, reason: 'Already shared'});
            continue;
          }

          // 檢查空間分享數量限制
          const shareCountQuery = await db.collection('space_shares')
            .where('spaceId', '==', spaceId)
            .where('status', '==', 'active')
            .get();

          if (shareCountQuery.size >= 500) {
            results.failed.push({email, reason: 'Space sharing limit reached (500 users)'});
            continue;
          }

          // 創建分享記錄
          const shareRef = db.collection('space_shares').doc();
          const shareData = {
            spaceId,
            ownerUserId,
            sharedWithEmail: email,
            permission,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          firestoreBatch.set(shareRef, shareData);

          // 生成邀請連結
          const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${shareRef.id}`;
          results.success.push({
            email,
            shareId: shareRef.id,
            inviteLink
          });

        } catch (error) {
          results.failed.push({email, reason: error.message});
        }
      }

      // 執行批次寫入
      if (results.success.length > 0) {
        await firestoreBatch.commit();
      }

      // 避免超過速率限制
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 更新統計
    results.summary.successful = results.success.length;
    results.summary.failed = results.failed.length;

    return results;
  };

  C. 邀請連結處理

  // 處理邀請連結訪問
  const handleInviteAccess = async (shareId: string) => {
    try {
      // 查詢分享記錄
      const shareDoc = await db.collection('space_shares').doc(shareId).get();

      if (!shareDoc.exists) {
        throw new Error('Invite not found');
      }

      const shareData = shareDoc.data();

      // 檢查邀請是否有效
      const createdAt = shareData.createdAt.toDate();
      const expiryDate = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 天

      if (new Date() > expiryDate) {
        throw new Error('Invite has expired');
      }

      if (shareData.status !== 'active') {
        throw new Error('Invite has been revoked');
      }

      // 獲取空間信息
      const spaceDoc = await db.collection('prompt_spaces').doc(shareData.spaceId).get();
      const spaceData = spaceDoc.data();

      // 獲取擁有者信息
      const ownerDoc = await db.collection('users').doc(shareData.ownerUserId).get();
      const ownerData = ownerDoc.data();

      // 檢查用戶是否已註冊
      const userQuery = await db.collection('users')
        .where('email', '==', shareData.sharedWithEmail)
        .limit(1)
        .get();

      return {
        spaceId: shareData.spaceId,
        spaceName: spaceData.name,
        ownerName: ownerData.name,
        permission: shareData.permission,
        needsRegistration: userQuery.empty,
        email: shareData.sharedWithEmail,
        isValid: true,
        expiresAt: expiryDate.toISOString(),
        createdAt: createdAt.toISOString()
      };

    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  };

  ---
  7. 限制與約束

  技術限制

  const TECHNICAL_LIMITS = {
    // 空間限制
    maxSharesPerSpace: 500,

    // 批量操作限制
    createSharesPerRequest: 50,
    deleteSharesPerRequest: 50,
    updateSharesPerRequest: 30,

    // 邀請限制
    inviteLinkExpiry: 30 * 24 * 60 * 60 * 1000, // 30 天 (毫秒)

    // 安全限制
    emailValidation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    preventDuplicateShares: true,

    // 權限限制
    defaultPermission: 'view',
    onlyOwnerCanShare: true,
    supportPermissionChange: true,
  };

  Firebase 免費版評估

  const FIREBASE_USAGE_ANALYSIS = {
    // 最大負載情況：500 人空間
    maxConcurrentUsers: 500,

    // 寫入操作 (一次性邀請 500 人)
    bulkInviteWrites: 500,
    dailyWriteQuotaUsage: "2.5%", // 500/20000

    // 讀取操作 (500 用戶活躍)
    dailyActiveReads: 1000,       // 每用戶 2 次讀取
    dailyReadQuotaUsage: "2%",    // 1000/50000

    // 儲存空間
    spaceSharesStorage: "< 10 MB", // 500 用戶 × 20KB/記錄

    conclusion: "免費版完全足夠支援此功能規模"
  };

  ---
  8. 實現階段規劃

  Phase 1: Core Sharing API (Week 1)

  const PHASE_1_TASKS = [
    // 後端開發
    "創建 space_shares 集合和索引",
    "實現分享 CRUD API",
    "實現權限檢查中間件",
    "實現智能批量處理",

    // 前端開發
    "更新 spaceSettingsDialog 組件",
    "添加權限選擇器 UI",
    "實現前端 API 整合",
    "添加錯誤處理",

    // 測試
    "單元測試：權限檢查",
    "整合測試：批量操作",
    "UI 測試：分享流程"
  ];

  Phase 2: Invitation System (Week 2)

  const PHASE_2_TASKS = [
    // 邀請系統
    "實現邀請連結生成",
    "創建 /invite/[shareId] 頁面",
    "實現用戶註冊後自動加入",
    "添加邀請過期處理",

    // 用戶體驗
    "更新 promptSpaceSelector 顯示 shared spaces",
    "實現 shared space 權限控制",
    "添加分享狀態指示器",

    // 測試
    "端對端測試：邀請流程",
    "跨瀏覽器測試",
    "行動裝置適配測試"
  ];

  Phase 3: Polish & Optimization (Week 3)

  const PHASE_3_TASKS = [
    // 效能優化
    "查詢效能優化",
    "前端狀態管理優化",
    "批量操作進度指示器",

    // 用戶體驗提升
    "錯誤訊息完善",
    "載入狀態改善",
    "成功反饋機制",

    // 文檔與維護
    "API 文檔補充",
    "元件 Storybook",
    "部署指南"
  ];

  ---
  9. 測試策略

  A. API 測試

  const API_TEST_CASES = [
    // 權限測試
    {
      name: "只有 owner 可以管理分享",
      test: async () => {
        // 測試非 owner 用戶嘗試分享時被拒絕
      }
    },

    // 批量操作測試
    {
      name: "批量邀請 50 個 email",
      test: async () => {
        // 測試批量處理性能和正確性
      }
    },

    // 權限變更測試
    {
      name: "修改用戶權限從 view 到 edit",
      test: async () => {
        // 測試權限更新功能
      }
    },

    // 邊界條件測試
    {
      name: "空間分享上限 500 用戶",
      test: async () => {
        // 測試達到上限時的行為
      }
    }
  ];

  B. 前端測試

  const FRONTEND_TEST_CASES = [
    // 組件測試
    "spaceSettingsDialog 權限選擇器",
    "批量選擇和刪除功能",
    "權限變更 UI 回饋",

    // 整合測試  
    "完整分享流程測試",
    "邀請連結訪問測試",
    "權限邊界 UI 測試",

    // 用戶體驗測試
    "載入狀態顯示",
    "錯誤處理提示",
    "成功操作反饋"
  ];

  ---
  10. 風險評估與緩解

  技術風險

  const TECHNICAL_RISKS = {
    // 🟡 中等風險
    firestoreIndexes: {
      risk: "複合索引設置錯誤導致查詢失敗",
      mitigation: "先在測試環境驗證所有索引"
    },

    batchProcessing: {
      risk: "大量批次操作超過 Firestore 限制",
      mitigation: "實現速率限制和錯誤重試機制"
    },

    // 🟢 低風險
    permissionLogic: {
      risk: "權限檢查邏輯錯誤",
      mitigation: "完整的單元測試覆蓋"
    }
  };

  產品風險

  const PRODUCT_RISKS = {
    // 🟡 中等風險
    noEmailNotification: {
      risk: "用戶可能忘記手動發送邀請連結",
      mitigation: "UI 提供明確的邀請連結複製功能"
    },

    // 🟢 低風險
    simplifiedPermissions: {
      risk: "view/edit 權限可能不夠細緻",
      mitigation: "後續可擴展更細緻的權限控制"
    }
  };

  ---
  11. 成功指標

  功能指標

  const SUCCESS_METRICS = {
    // 基礎功能
    shareCreation: "用戶能成功創建分享",
    permissionControl: "權限控制正確運作",
    bulkOperations: "批量操作穩定執行",

    // 性能指標
    apiResponseTime: "< 2 秒",
    batchProcessingTime: "50 個 email < 10 秒",
    uiResponsiveness: "UI 操作 < 100ms 回應",

    // 可靠性指標
    errorRate: "< 1%",
    dataConsistency: "100% 資料一致性",
    permissionAccuracy: "100% 權限檢查準確性"
  };

  ---
  📋 Share Space 功能完整規格書 v2.0 確認完成！